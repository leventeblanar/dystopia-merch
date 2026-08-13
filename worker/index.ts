import Stripe from "stripe";
import { createRemoteJWKSet, jwtVerify } from "jose";

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
};

type VariantRow = {
  id: number;
  product_id: number;
  size: string;
  stock: number;
  sku: string | null;
};

type ImageRow = {
  id: number;
  product_id: number;
  object_key: string;
  alt_text: string | null;
  sort_order: number;
};

type AdminProductRow = ProductRow & {
  active: number;
  created_at: string;
};

type VariantWithProductRow = {
  variant_id: number;
  size: string;
  stock: number;
  product_id: number;
  product_name: string;
  price: number;
  currency: string;
};

type OrderRow = {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_postal_code: string;
  shipping_city: string;
  shipping_street_address: string;
  shipping_note: string | null;
  total_amount: number;
  currency: string;
  status: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
};

type OrderItemRow = {
  id: number;
  order_id: number;
  product_variant_id: number | null;
  product_name: string;
  variant_size: string;
  unit_price: number;
  quantity: number;
};

type CheckoutRequestBody = {
  customer: { name: string; email: string; phone: string };
  shipping: {
    postalCode: string;
    city: string;
    streetAddress: string;
    note?: string;
  };
  items: { variantId: number; quantity: number }[];
};

function getStripeClient(env: Env): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

let cachedAccessJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedAccessTeamDomain: string | null = null;

function getAccessTeamDomain(env: Env): string {
  return env.CF_ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function getAccessJWKS(env: Env) {
  const teamDomain = getAccessTeamDomain(env);

  if (!cachedAccessJWKS || cachedAccessTeamDomain !== teamDomain) {
    cachedAccessJWKS = createRemoteJWKSet(
      new URL(`https://${teamDomain}/cdn-cgi/access/certs`),
    );
    cachedAccessTeamDomain = teamDomain;
  }

  return cachedAccessJWKS;
}

async function requireAdmin(
  request: Request,
  env: Env,
): Promise<{ email: string } | Response> {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");

  if (!token) {
    return Response.json({ error: "Nincs jogosultság." }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, getAccessJWKS(env), {
      issuer: `https://${getAccessTeamDomain(env)}`,
      audience: env.CF_ACCESS_AUD,
    });

    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;

    const allowedEmails = env.ADMIN_ALLOWED_EMAILS.split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0);

    if (!email || !allowedEmails.includes(email)) {
      return Response.json({ error: "Nincs jogosultság." }, { status: 403 });
    }

    return { email };
  } catch (error) {
    console.error("Access JWT verification failed", error);
    return Response.json({ error: "Nincs jogosultság." }, { status: 401 });
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateCheckoutBody(body: unknown): body is CheckoutRequestBody {
  if (!body || typeof body !== "object") {
    return false;
  }

  const { customer, shipping, items } = body as Record<string, unknown>;

  if (
    !customer ||
    typeof customer !== "object" ||
    !isNonEmptyString((customer as Record<string, unknown>).name) ||
    !isNonEmptyString((customer as Record<string, unknown>).email) ||
    !isNonEmptyString((customer as Record<string, unknown>).phone)
  ) {
    return false;
  }

  if (
    !shipping ||
    typeof shipping !== "object" ||
    !isNonEmptyString((shipping as Record<string, unknown>).postalCode) ||
    !isNonEmptyString((shipping as Record<string, unknown>).city) ||
    !isNonEmptyString((shipping as Record<string, unknown>).streetAddress)
  ) {
    return false;
  }

  if (!Array.isArray(items) || items.length === 0) {
    return false;
  }

  return items.every(
    (item) =>
      item &&
      typeof item === "object" &&
      Number.isInteger((item as Record<string, unknown>).variantId) &&
      Number.isInteger((item as Record<string, unknown>).quantity) &&
      ((item as Record<string, unknown>).quantity as number) > 0,
  );
}

async function sendOrderNotificationEmail(
  env: Env,
  order: OrderRow,
  items: OrderItemRow[],
): Promise<void> {
  try {
    const itemsHtml = items
      .map(
        (item) =>
          `<li>${item.product_name} (${item.variant_size}) &times; ${item.quantity} &mdash; ${(
            item.unit_price * item.quantity
          ).toLocaleString("hu-HU")} ${order.currency}</li>`,
      )
      .join("");

    const html = `
      <h2>Új rendelés #${order.id}</h2>
      <p><strong>${order.customer_name}</strong><br>${order.customer_email} · ${order.customer_phone}</p>
      <p>${order.shipping_postal_code} ${order.shipping_city}, ${order.shipping_street_address}</p>
      ${order.shipping_note ? `<p>Megjegyzés: ${order.shipping_note}</p>` : ""}
      <ul>${itemsHtml}</ul>
      <p>Összesen: <strong>${order.total_amount.toLocaleString("hu-HU")} ${order.currency}</strong></p>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: env.ORDER_NOTIFICATION_EMAIL,
        subject: `Új rendelés #${order.id} — ${order.total_amount.toLocaleString("hu-HU")} ${order.currency}`,
        html,
      }),
    });
  } catch (error) {
    console.error("Failed to send order notification email", error);
  }
}

async function handleCheckout(request: Request, env: Env): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Érvénytelen kérés." }, { status: 400 });
  }

  if (!validateCheckoutBody(body)) {
    return Response.json(
      { error: "Hiányzó vagy érvénytelen adatok." },
      { status: 400 },
    );
  }

  const { customer, shipping, items } = body;

  try {
    const lineItems: {
      variantId: number;
      productName: string;
      size: string;
      unitPrice: number;
      quantity: number;
      currency: string;
    }[] = [];

    for (const item of items) {
      const row = await env.DB.prepare(
        `
        SELECT
          pv.id AS variant_id,
          pv.size,
          pv.stock,
          p.id AS product_id,
          p.name AS product_name,
          p.price,
          p.currency
        FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        WHERE pv.id = ?
        `,
      )
        .bind(item.variantId)
        .first<VariantWithProductRow>();

      if (!row) {
        return Response.json(
          {
            error: `A kiválasztott termékváltozat (#${item.variantId}) nem található.`,
          },
          { status: 400 },
        );
      }

      if (row.stock < item.quantity) {
        return Response.json(
          {
            error: `Nincs elég készleten a(z) "${row.product_name} (${row.size})" termékből.`,
          },
          { status: 409 },
        );
      }

      lineItems.push({
        variantId: row.variant_id,
        productName: row.product_name,
        size: row.size,
        unitPrice: row.price,
        quantity: item.quantity,
        currency: row.currency,
      });
    }

    const totalAmount = lineItems.reduce(
      (sum, lineItem) => sum + lineItem.unitPrice * lineItem.quantity,
      0,
    );
    const currency = lineItems[0].currency;

    const orderInsert = await env.DB.prepare(
      `
      INSERT INTO orders (
        customer_name, customer_email, customer_phone,
        shipping_postal_code, shipping_city, shipping_street_address, shipping_note,
        total_amount, currency, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
    )
      .bind(
        customer.name,
        customer.email,
        customer.phone,
        shipping.postalCode,
        shipping.city,
        shipping.streetAddress,
        shipping.note ?? null,
        totalAmount,
        currency,
      )
      .run();

    const orderId = orderInsert.meta.last_row_id;

    await env.DB.batch(
      lineItems.map((lineItem) =>
        env.DB.prepare(
          `
          INSERT INTO order_items (
            order_id, product_variant_id, product_name, variant_size, unit_price, quantity
          ) VALUES (?, ?, ?, ?, ?, ?)
          `,
        ).bind(
          orderId,
          lineItem.variantId,
          lineItem.productName,
          lineItem.size,
          lineItem.unitPrice,
          lineItem.quantity,
        ),
      ),
    );

    const stripe = getStripeClient(env);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customer.email,
      line_items: lineItems.map((lineItem) => ({
        quantity: lineItem.quantity,
        price_data: {
          currency: lineItem.currency.toLowerCase(),
          unit_amount: lineItem.unitPrice,
          product_data: {
            name: `${lineItem.productName} (${lineItem.size})`,
          },
        },
      })),
      metadata: { orderId: String(orderId) },
      success_url: `${env.PUBLIC_BASE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.PUBLIC_BASE_URL}/order/cancelled`,
    });

    await env.DB.prepare(
      "UPDATE orders SET stripe_checkout_session_id = ? WHERE id = ?",
    )
      .bind(session.id, orderId)
      .run();

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Checkout failed", error);

    return Response.json(
      { error: "A rendelés feldolgozása közben hiba történt." },
      { status: 500 },
    );
  }
}

async function handleStripeWebhook(
  request: Request,
  env: Env,
): Promise<Response> {
  const signature = request.headers.get("Stripe-Signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient(env);

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = Number(session.metadata?.orderId);

    if (Number.isInteger(orderId)) {
      const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?")
        .bind(orderId)
        .first<OrderRow>();

      if (order && order.status !== "paid") {
        const items = (
          await env.DB.prepare(
            "SELECT * FROM order_items WHERE order_id = ?",
          )
            .bind(orderId)
            .all<OrderItemRow>()
        ).results;

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        const statements = [
          env.DB.prepare(
            "UPDATE orders SET status = 'paid', stripe_payment_intent_id = ? WHERE id = ?",
          ).bind(paymentIntentId, orderId),
          ...items
            .filter((item) => item.product_variant_id !== null)
            .map((item) =>
              env.DB.prepare(
                "UPDATE product_variants SET stock = MAX(stock - ?, 0) WHERE id = ?",
              ).bind(item.quantity, item.product_variant_id),
            ),
        ];

        await env.DB.batch(statements);

        await sendOrderNotificationEmail(
          env,
          { ...order, status: "paid" },
          items,
        );
      }
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = Number(session.metadata?.orderId);

    if (Number.isInteger(orderId)) {
      await env.DB.prepare(
        "UPDATE orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'",
      )
        .bind(orderId)
        .run();
    }
  }

  return Response.json({ received: true });
}

async function attachVariantsAndImages<T extends { id: number }>(
  env: Env,
  products: T[],
): Promise<(T & { variants: VariantRow[]; images: (ImageRow & { url: string })[] })[]> {
  return Promise.all(
    products.map(async (product) => {
      const variantsResult = await env.DB.prepare(
        `
        SELECT id, product_id, size, stock, sku
        FROM product_variants
        WHERE product_id = ?
        ORDER BY id
        `,
      )
        .bind(product.id)
        .all<VariantRow>();

      const imagesResult = await env.DB.prepare(
        `
        SELECT id, product_id, object_key, alt_text, sort_order
        FROM product_images
        WHERE product_id = ?
        ORDER BY sort_order
        `,
      )
        .bind(product.id)
        .all<ImageRow>();

      return {
        ...product,
        variants: variantsResult.results,
        images: imagesResult.results.map((image) => ({
          ...image,
          url: `/api/images/${image.object_key}`,
        })),
      };
    }),
  );
}

type ProductInput = {
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  currency?: string;
  active?: boolean;
};

function validateProductInput(body: unknown): body is ProductInput {
  if (!body || typeof body !== "object") {
    return false;
  }

  const { name, slug, price, currency, active, description } =
    body as Record<string, unknown>;

  if (!isNonEmptyString(name) || !isNonEmptyString(slug)) {
    return false;
  }

  if (!Number.isFinite(price) || (price as number) < 0) {
    return false;
  }

  if (currency !== undefined && !isNonEmptyString(currency)) {
    return false;
  }

  if (active !== undefined && typeof active !== "boolean") {
    return false;
  }

  if (description !== undefined && description !== null && typeof description !== "string") {
    return false;
  }

  return true;
}

type VariantInput = {
  size: string;
  stock: number;
  sku?: string | null;
};

function validateVariantInput(body: unknown): body is VariantInput {
  if (!body || typeof body !== "object") {
    return false;
  }

  const { size, stock, sku } = body as Record<string, unknown>;

  if (!isNonEmptyString(size)) {
    return false;
  }

  if (!Number.isInteger(stock) || (stock as number) < 0) {
    return false;
  }

  if (sku !== undefined && sku !== null && !isNonEmptyString(sku)) {
    return false;
  }

  return true;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("UNIQUE constraint failed");
}

async function handleAdminRequest(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const auth = await requireAdmin(request, env);

  if (auth instanceof Response) {
    return auth;
  }

  const path = url.pathname;

  const productIdMatch = path.match(/^\/api\/admin\/products\/(\d+)$/);
  const variantsCollectionMatch = path.match(
    /^\/api\/admin\/products\/(\d+)\/variants$/,
  );
  const variantIdMatch = path.match(/^\/api\/admin\/variants\/(\d+)$/);
  const imagesCollectionMatch = path.match(
    /^\/api\/admin\/products\/(\d+)\/images$/,
  );
  const imageIdMatch = path.match(/^\/api\/admin\/images\/(\d+)$/);

  try {
    if (path === "/api/admin/products" && request.method === "GET") {
      const productsResult = await env.DB.prepare(
        `
        SELECT id, name, slug, description, price, currency, active, created_at
        FROM products
        ORDER BY id DESC
        `,
      ).all<AdminProductRow>();

      const products = await attachVariantsAndImages(env, productsResult.results);

      return Response.json(products);
    }

    if (path === "/api/admin/products" && request.method === "POST") {
      const body = await request.json().catch(() => null);

      if (!validateProductInput(body)) {
        return Response.json(
          { error: "Hiányzó vagy érvénytelen adatok." },
          { status: 400 },
        );
      }

      const insert = await env.DB.prepare(
        `
        INSERT INTO products (name, slug, description, price, currency, active)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
        .bind(
          body.name,
          body.slug,
          body.description ?? null,
          body.price,
          body.currency ?? "HUF",
          body.active === false ? 0 : 1,
        )
        .run();

      return Response.json(
        { id: insert.meta.last_row_id },
        { status: 201 },
      );
    }

    if (productIdMatch && request.method === "PUT") {
      const productId = Number(productIdMatch[1]);
      const body = await request.json().catch(() => null);

      if (!validateProductInput(body)) {
        return Response.json(
          { error: "Hiányzó vagy érvénytelen adatok." },
          { status: 400 },
        );
      }

      const result = await env.DB.prepare(
        `
        UPDATE products
        SET name = ?, slug = ?, description = ?, price = ?, currency = ?, active = ?
        WHERE id = ?
        `,
      )
        .bind(
          body.name,
          body.slug,
          body.description ?? null,
          body.price,
          body.currency ?? "HUF",
          body.active === false ? 0 : 1,
          productId,
        )
        .run();

      if (result.meta.changes === 0) {
        return Response.json({ error: "A termék nem található." }, { status: 404 });
      }

      return Response.json({ success: true });
    }

    if (productIdMatch && request.method === "DELETE") {
      const productId = Number(productIdMatch[1]);

      const images = await env.DB.prepare(
        "SELECT object_key FROM product_images WHERE product_id = ?",
      )
        .bind(productId)
        .all<{ object_key: string }>();

      await Promise.all(
        images.results.map((image) =>
          env.dystopia_merch_images.delete(image.object_key),
        ),
      );

      const result = await env.DB.prepare("DELETE FROM products WHERE id = ?")
        .bind(productId)
        .run();

      if (result.meta.changes === 0) {
        return Response.json({ error: "A termék nem található." }, { status: 404 });
      }

      return Response.json({ success: true });
    }

    if (variantsCollectionMatch && request.method === "POST") {
      const productId = Number(variantsCollectionMatch[1]);
      const body = await request.json().catch(() => null);

      if (!validateVariantInput(body)) {
        return Response.json(
          { error: "Hiányzó vagy érvénytelen adatok." },
          { status: 400 },
        );
      }

      const product = await env.DB.prepare("SELECT id FROM products WHERE id = ?")
        .bind(productId)
        .first();

      if (!product) {
        return Response.json({ error: "A termék nem található." }, { status: 404 });
      }

      const insert = await env.DB.prepare(
        `
        INSERT INTO product_variants (product_id, size, stock, sku)
        VALUES (?, ?, ?, ?)
        `,
      )
        .bind(productId, body.size, body.stock, body.sku ?? null)
        .run();

      return Response.json({ id: insert.meta.last_row_id }, { status: 201 });
    }

    if (variantIdMatch && request.method === "PUT") {
      const variantId = Number(variantIdMatch[1]);
      const body = await request.json().catch(() => null);

      if (!validateVariantInput(body)) {
        return Response.json(
          { error: "Hiányzó vagy érvénytelen adatok." },
          { status: 400 },
        );
      }

      const result = await env.DB.prepare(
        "UPDATE product_variants SET size = ?, stock = ?, sku = ? WHERE id = ?",
      )
        .bind(body.size, body.stock, body.sku ?? null, variantId)
        .run();

      if (result.meta.changes === 0) {
        return Response.json({ error: "A méret nem található." }, { status: 404 });
      }

      return Response.json({ success: true });
    }

    if (variantIdMatch && request.method === "DELETE") {
      const variantId = Number(variantIdMatch[1]);

      const result = await env.DB.prepare("DELETE FROM product_variants WHERE id = ?")
        .bind(variantId)
        .run();

      if (result.meta.changes === 0) {
        return Response.json({ error: "A méret nem található." }, { status: 404 });
      }

      return Response.json({ success: true });
    }

    if (imagesCollectionMatch && request.method === "POST") {
      const productId = Number(imagesCollectionMatch[1]);

      const product = await env.DB.prepare("SELECT id FROM products WHERE id = ?")
        .bind(productId)
        .first();

      if (!product) {
        return Response.json({ error: "A termék nem található." }, { status: 404 });
      }

      const formData = await request.formData().catch(() => null);
      const file = formData?.get("file");

      if (!(file instanceof File)) {
        return Response.json({ error: "Hiányzó kép." }, { status: 400 });
      }

      const altTextValue = formData?.get("altText");
      const sortOrderValue = formData?.get("sortOrder");
      const sortOrder =
        typeof sortOrderValue === "string" && sortOrderValue.trim() !== ""
          ? Number(sortOrderValue)
          : 0;

      const objectKey = `products/${productId}/${crypto.randomUUID()}`;

      await env.dystopia_merch_images.put(objectKey, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type || "application/octet-stream" },
      });

      const insert = await env.DB.prepare(
        `
        INSERT INTO product_images (product_id, object_key, alt_text, sort_order)
        VALUES (?, ?, ?, ?)
        `,
      )
        .bind(
          productId,
          objectKey,
          typeof altTextValue === "string" && altTextValue.trim() ? altTextValue : null,
          Number.isFinite(sortOrder) ? sortOrder : 0,
        )
        .run();

      return Response.json(
        {
          id: insert.meta.last_row_id,
          objectKey,
          url: `/api/images/${objectKey}`,
        },
        { status: 201 },
      );
    }

    if (imageIdMatch && request.method === "DELETE") {
      const imageId = Number(imageIdMatch[1]);

      const image = await env.DB.prepare(
        "SELECT object_key FROM product_images WHERE id = ?",
      )
        .bind(imageId)
        .first<{ object_key: string }>();

      if (!image) {
        return Response.json({ error: "A kép nem található." }, { status: 404 });
      }

      await env.dystopia_merch_images.delete(image.object_key);

      await env.DB.prepare("DELETE FROM product_images WHERE id = ?")
        .bind(imageId)
        .run();

      return Response.json({ success: true });
    }

    if (path === "/api/admin/orders" && request.method === "GET") {
      const ordersResult = await env.DB.prepare(
        "SELECT * FROM orders ORDER BY created_at DESC",
      ).all<OrderRow & { created_at: string }>();

      const orders = await Promise.all(
        ordersResult.results.map(async (order) => {
          const itemsResult = await env.DB.prepare(
            "SELECT * FROM order_items WHERE order_id = ?",
          )
            .bind(order.id)
            .all<OrderItemRow>();

          return { ...order, items: itemsResult.results };
        }),
      );

      return Response.json(orders);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Admin request failed", error);

    if (isUniqueConstraintError(error)) {
      return Response.json(
        { error: "Ez az érték már foglalt (pl. slug vagy sku)." },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Hiba történt a kérés feldolgozása közben." },
      { status: 500 },
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
      });
    }

    if (request.method === "GET" && url.pathname === "/api/products") {
        const productsResult = await env.DB
            .prepare(`
            SELECT
                id,
                name,
                slug,
                description,
                price,
                currency
            FROM products
            WHERE active = 1
            ORDER BY id DESC
            `)
            .all<ProductRow>();

        const products = await attachVariantsAndImages(env, productsResult.results);

        return Response.json(products);
        }

    if (
        request.method === "GET" &&
        url.pathname.startsWith("/api/images/")
    ) {
        const objectKey = decodeURIComponent(
            url.pathname.replace("/api/images/", ""),
        );

        const object = await env.dystopia_merch_images.get(objectKey);

        if (!object) {
            return new Response("Image not found", {
            status: 404,
            });
        }

        const headers = new Headers();

        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);

        return new Response(object.body, {
            headers,
        });
    }

    if (request.method === "POST" && url.pathname === "/api/checkout") {
      return handleCheckout(request, env);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/webhooks/stripe"
    ) {
      return handleStripeWebhook(request, env);
    }

    if (url.pathname.startsWith("/api/admin/")) {
      return handleAdminRequest(request, env, url);
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        {
          error: "Not found",
        },
        {
          status: 404,
        },
      );
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
