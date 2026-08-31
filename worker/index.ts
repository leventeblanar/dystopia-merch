import Stripe from "stripe";
import { createRemoteJWKSet, jwtVerify } from "jose";

import {
  getShippingFee,
  SIZELESS_VARIANT_LABEL,
  VARIANT_CUTS,
  PRODUCT_CATEGORIES,
  formatSizeCutLabel,
  type VariantCut,
  type ProductCategory,
} from "../shared/constants";

// Stripe pays out HUF/TWD as zero-decimal currencies, but still requires
// amounts sent to the Checkout/Payment APIs in the currency's subunit —
// https://stripe.com/docs/currencies#special-cases
const STRIPE_SUBUNIT_CHARGE_CURRENCIES = new Set(["huf", "twd"]);
const ADMIN_PANEL_URL = "https://dystopiahungary.com/admin";

function toStripeUnitAmount(amount: number, currency: string): number {
  return STRIPE_SUBUNIT_CHARGE_CURRENCIES.has(currency.toLowerCase())
    ? Math.round(amount * 100)
    : amount;
}

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  category: string;
};

type VariantRow = {
  id: number;
  product_id: number;
  size: string;
  cut: string;
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
  cut: string;
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
  processing: number;
  shipped: number;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
};

type OrderItemRow = {
  id: number;
  order_id: number;
  product_variant_id: number | null;
  product_name: string;
  variant_size: string;
  variant_cut: string;
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatHuf(amount: number, currency: string): string {
  return `${amount.toLocaleString("hu-HU")} ${currency}`;
}

async function sendViaResend(
  env: Env,
  params: { to: string | string[]; subject: string; html: string },
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Resend request failed (${response.status}): ${errorBody}`,
    );
  }
}

async function sendOrderNotificationEmail(
  env: Env,
  order: OrderRow,
  items: OrderItemRow[],
): Promise<void> {
  try {
    const bodyHtml = `
            <tr>
              <td style="padding: 32px 40px 8px;">
                <h2 style="margin: 0 0 8px; color: #ffffff; font-size: 19px;">Új rendelés érkezett</h2>
                <p style="margin: 0; color: #b7b2ba; font-size: 14px; line-height: 1.6;">
                  ${escapeHtml(order.customer_name)} (${escapeHtml(order.customer_email)} &middot; ${escapeHtml(order.customer_phone)})
                  leadott egy rendelést. Az alábbiakban a rendelés részletei olvashatók.
                </p>
              </td>
            </tr>

            ${renderOrderReferenceRow(order)}
            ${renderOrderItemsBlock(order, items)}
            ${renderShippingAddressBlock(order)}

            <tr>
              <td style="padding: 28px 40px 0;" align="center">
                <a href="${ADMIN_PANEL_URL}" style="display: inline-block; background-color: #a91c32; color: #ffffff; text-decoration: none; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; padding: 14px 28px; border-radius: 8px;">
                  Rendelés kezelése
                </a>
              </td>
            </tr>`;

    const recipients = env.ORDER_NOTIFICATION_EMAIL.split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    await sendViaResend(env, {
      to: recipients,
      subject: `Új rendelés #${order.id} — ${formatHuf(order.total_amount, order.currency)}`,
      html: renderEmailShell(
        bodyHtml,
        "Ez egy automatikus értesítés az új rendelésről.",
      ),
    });
  } catch (error) {
    console.error("Failed to send order notification email", error);
  }
}

function renderEmailShell(
  bodyHtml: string,
  footerText = "Ha kérdésed van a rendeléseddel kapcsolatban, válaszolj erre az emailre.",
): string {
  return `
<!doctype html>
<html lang="hu">
  <body style="margin: 0; padding: 0; background-color: #000000; font-family: Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width: 600px; max-width: 100%; background-color: #0c0b0e; border-radius: 16px; overflow: hidden; border: 1px solid #262228;">

            <tr>
              <td style="padding: 36px 40px 24px; text-align: center; border-bottom: 1px solid #262228;">
                <p style="margin: 0 0 6px; color: #a91c32; font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase;">
                  Official Dystopia merchandise
                </p>
                <h1 style="margin: 0; color: #ffffff; font-size: 26px; letter-spacing: 0.14em; text-transform: uppercase;">
                  DYSTOPIA
                </h1>
              </td>
            </tr>

            ${bodyHtml}

            <tr>
              <td style="padding: 32px 40px 40px; text-align: center;">
                <p style="margin: 0; color: #5c565f; font-size: 12px; line-height: 1.6;">
                  ${footerText}
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderOrderReferenceRow(order: OrderRow): string {
  return `
    <tr>
      <td style="padding: 20px 40px 0;">
        <p style="margin: 0; color: #8a848c; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">
          Rendelés &mdash; #${order.id}
        </p>
      </td>
    </tr>`;
}

function renderOrderItemsBlock(order: OrderRow, items: OrderItemRow[]): string {
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  const shippingFee = order.total_amount - itemsSubtotal;

  const itemRows = items
    .map(
      (item) => `
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #262228; color: #f5f5f5; font-size: 14px;">
              ${escapeHtml(item.product_name)}
              <span style="display: block; color: #8a848c; font-size: 12px; margin-top: 2px;">
                ${
                  item.variant_size === SIZELESS_VARIANT_LABEL
                    ? `${item.quantity} db`
                    : `Méret: ${escapeHtml(formatSizeCutLabel(item.variant_size, item.variant_cut))} &middot; ${item.quantity} db`
                }
              </span>
            </td>
            <td style="padding: 14px 0; border-bottom: 1px solid #262228; color: #f5f5f5; font-size: 14px; text-align: right; white-space: nowrap;">
              ${formatHuf(item.unit_price * item.quantity, order.currency)}
            </td>
          </tr>`,
    )
    .join("");

  return `
            <tr>
              <td style="padding: 12px 40px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${itemRows}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 18px 40px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 4px 0; color: #b7b2ba; font-size: 13px;">Részösszeg</td>
                    <td style="padding: 4px 0; color: #b7b2ba; font-size: 13px; text-align: right;">
                      ${formatHuf(itemsSubtotal, order.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #b7b2ba; font-size: 13px;">Szállítás</td>
                    <td style="padding: 4px 0; color: #b7b2ba; font-size: 13px; text-align: right;">
                      ${shippingFee > 0 ? formatHuf(shippingFee, order.currency) : "Ingyenes"}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 0 0; border-top: 1px solid #262228; color: #ffffff; font-size: 16px; font-weight: bold;">
                      Összesen
                    </td>
                    <td style="padding: 16px 0 0; border-top: 1px solid #262228; color: #ffffff; font-size: 16px; font-weight: bold; text-align: right;">
                      ${formatHuf(order.total_amount, order.currency)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`;
}

function renderShippingAddressBlock(order: OrderRow): string {
  const addressLines = [
    `${escapeHtml(order.shipping_postal_code)} ${escapeHtml(order.shipping_city)}`,
    escapeHtml(order.shipping_street_address),
  ];

  return `
            <tr>
              <td style="padding: 32px 40px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #141216; border-radius: 12px;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p style="margin: 0 0 10px; color: #a91c32; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;">
                        Szállítási cím
                      </p>
                      <p style="margin: 0; color: #f5f5f5; font-size: 14px; line-height: 1.6;">
                        ${escapeHtml(order.customer_name)}<br>
                        ${addressLines.join("<br>")}
                      </p>
                      <p style="margin: 10px 0 0; color: #8a848c; font-size: 13px; line-height: 1.5;">
                        ${escapeHtml(order.customer_phone)}
                      </p>
                      ${
                        order.shipping_note
                          ? `<p style="margin: 12px 0 0; color: #8a848c; font-size: 13px; line-height: 1.5;">Megjegyzés: ${escapeHtml(order.shipping_note)}</p>`
                          : ""
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`;
}

async function sendOrderConfirmationEmail(
  env: Env,
  order: OrderRow,
  items: OrderItemRow[],
): Promise<void> {
  try {
    const bodyHtml = `
            <tr>
              <td style="padding: 32px 40px 8px;">
                <h2 style="margin: 0 0 8px; color: #ffffff; font-size: 19px;">Köszönjük a rendelésed!</h2>
                <p style="margin: 0; color: #b7b2ba; font-size: 14px; line-height: 1.6;">
                  A fizetés sikeresen megtörtént, a rendelésed feldolgozás alatt áll. Az alábbiakban
                  összefoglaltuk, mit rendeltél és hova szállítjuk.
                </p>
              </td>
            </tr>

            ${renderOrderReferenceRow(order)}
            ${renderOrderItemsBlock(order, items)}
            ${renderShippingAddressBlock(order)}`;

    await sendViaResend(env, {
      to: order.customer_email,
      subject: `Rendelésed visszaigazolva — #${order.id}`,
      html: renderEmailShell(bodyHtml),
    });
  } catch (error) {
    console.error("Failed to send order confirmation email", error);
  }
}

async function sendOrderProcessingEmail(
  env: Env,
  order: OrderRow,
  items: OrderItemRow[],
): Promise<void> {
  try {
    const bodyHtml = `
            <tr>
              <td style="padding: 32px 40px 8px;">
                <h2 style="margin: 0 0 8px; color: #ffffff; font-size: 19px;">A rendelésed feldolgozás alatt áll</h2>
                <p style="margin: 0; color: #b7b2ba; font-size: 14px; line-height: 1.6;">
                  Jó hír: elkezdtük előkészíteni a csomagodat! Csapatunk most válogatja és
                  csomagolja össze a lentebb részletezett tételeket, amint ezzel elkészülünk és a
                  csomag postára/futárnak átadásra kerül, egy újabb emailben értesítünk a
                  nyomkövetési adatokkal együtt. Az alábbiakban még egyszer összefoglaltuk a
                  rendelésed tartalmát és a szállítási címet, kérünk, ellenőrizd, hogy minden
                  helyes.
                </p>
              </td>
            </tr>

            ${renderOrderReferenceRow(order)}
            ${renderOrderItemsBlock(order, items)}
            ${renderShippingAddressBlock(order)}`;

    await sendViaResend(env, {
      to: order.customer_email,
      subject: `A rendelésed feldolgozás alatt áll — #${order.id}`,
      html: renderEmailShell(bodyHtml),
    });
  } catch (error) {
    console.error("Failed to send order processing email", error);
  }
}

async function sendOrderShippedEmail(
  env: Env,
  order: OrderRow,
  items: OrderItemRow[],
): Promise<void> {
  try {
    const bodyHtml = `
            <tr>
              <td style="padding: 32px 40px 8px;">
                <h2 style="margin: 0 0 8px; color: #ffffff; font-size: 19px;">Feladtuk a rendelésedet!</h2>
                <p style="margin: 0; color: #b7b2ba; font-size: 14px; line-height: 1.6;">
                  A csomagod útnak indult &mdash; postára/futárnak átadtuk, és hamarosan megérkezik
                  a lentebb megadott szállítási címre. Az alábbiakban még egyszer összefoglaltuk,
                  mit tartalmaz a csomag és hova érkezik.
                </p>
              </td>
            </tr>

            ${renderOrderReferenceRow(order)}
            ${renderOrderItemsBlock(order, items)}
            ${renderShippingAddressBlock(order)}`;

    await sendViaResend(env, {
      to: order.customer_email,
      subject: `Feladtuk a rendelésedet — #${order.id}`,
      html: renderEmailShell(bodyHtml),
    });
  } catch (error) {
    console.error("Failed to send order shipped email", error);
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
      cut: string;
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
          pv.cut,
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
        const label =
          row.size === SIZELESS_VARIANT_LABEL
            ? row.product_name
            : `${row.product_name} (${formatSizeCutLabel(row.size, row.cut)})`;

        return Response.json(
          {
            error: `Nincs elég készleten a(z) "${label}" termékből.`,
          },
          { status: 409 },
        );
      }

      lineItems.push({
        variantId: row.variant_id,
        productName: row.product_name,
        size: row.size,
        cut: row.cut,
        unitPrice: row.price,
        quantity: item.quantity,
        currency: row.currency,
      });
    }

    const itemsSubtotal = lineItems.reduce(
      (sum, lineItem) => sum + lineItem.unitPrice * lineItem.quantity,
      0,
    );
    const shippingFee = getShippingFee(itemsSubtotal);
    const totalAmount = itemsSubtotal + shippingFee;
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
            order_id, product_variant_id, product_name, variant_size, variant_cut, unit_price, quantity
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
        ).bind(
          orderId,
          lineItem.variantId,
          lineItem.productName,
          lineItem.size,
          lineItem.cut,
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
      line_items: [
        ...lineItems.map((lineItem) => ({
          quantity: lineItem.quantity,
          price_data: {
            currency: lineItem.currency.toLowerCase(),
            unit_amount: toStripeUnitAmount(
              lineItem.unitPrice,
              lineItem.currency,
            ),
            product_data: {
              name:
                lineItem.size === SIZELESS_VARIANT_LABEL
                  ? lineItem.productName
                  : `${lineItem.productName} (${formatSizeCutLabel(lineItem.size, lineItem.cut)})`,
            },
          },
        })),
        ...(shippingFee > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: currency.toLowerCase(),
                  unit_amount: toStripeUnitAmount(shippingFee, currency),
                  product_data: {
                    name: "Szállítási költség",
                  },
                },
              },
            ]
          : []),
      ],
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

        await Promise.all([
          sendOrderNotificationEmail(env, { ...order, status: "paid" }, items),
          sendOrderConfirmationEmail(env, { ...order, status: "paid" }, items),
        ]);
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
        SELECT id, product_id, size, cut, stock, sku
        FROM product_variants
        WHERE product_id = ?
        ORDER BY
          CASE cut
            WHEN 'unisex' THEN 1
            WHEN 'ferfi' THEN 2
            WHEN 'noi' THEN 3
            ELSE 4
          END,
          CASE UPPER(size)
            WHEN 'XS' THEN 1
            WHEN 'S' THEN 2
            WHEN 'M' THEN 3
            WHEN 'L' THEN 4
            WHEN 'XL' THEN 5
            WHEN 'XXL' THEN 6
            WHEN 'XXXL' THEN 7
            ELSE 8
          END,
          id
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
  category: ProductCategory;
};

function validateProductInput(body: unknown): body is ProductInput {
  if (!body || typeof body !== "object") {
    return false;
  }

  const { name, slug, price, currency, active, description, category } =
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

  if (
    typeof category !== "string" ||
    !PRODUCT_CATEGORIES.includes(category as ProductCategory)
  ) {
    return false;
  }

  return true;
}

type VariantInput = {
  size: string;
  cut?: VariantCut;
  stock: number;
  sku?: string | null;
};

function validateVariantInput(body: unknown): body is VariantInput {
  if (!body || typeof body !== "object") {
    return false;
  }

  const { size, cut, stock, sku } = body as Record<string, unknown>;

  if (!isNonEmptyString(size)) {
    return false;
  }

  if (
    cut !== undefined &&
    (typeof cut !== "string" || !VARIANT_CUTS.includes(cut as VariantCut))
  ) {
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

const OPTIMIZABLE_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

async function optimizeProductImage(
  env: Env,
  file: File,
): Promise<{ body: ReadableStream<Uint8Array> | ArrayBuffer; contentType: string }> {
  const fallback = async () => ({
    body: await file.arrayBuffer(),
    contentType: file.type || "application/octet-stream",
  });

  if (!OPTIMIZABLE_IMAGE_TYPES.has(file.type)) {
    return fallback();
  }

  try {
    const result = await env.IMAGES.input(file.stream())
      .transform({ width: 1600, fit: "scale-down" })
      .output({ format: "image/webp", quality: 82 });

    return { body: result.image(), contentType: "image/webp" };
  } catch (error) {
    console.error("Image optimization failed, storing original upload", error);
    return fallback();
  }
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
  const variantAdjustMatch = path.match(
    /^\/api\/admin\/variants\/(\d+)\/adjust-stock$/,
  );
  const imagesCollectionMatch = path.match(
    /^\/api\/admin\/products\/(\d+)\/images$/,
  );
  const imageIdMatch = path.match(/^\/api\/admin\/images\/(\d+)$/);
  const orderIdMatch = path.match(/^\/api\/admin\/orders\/(\d+)$/);

  try {
    if (path === "/api/admin/products" && request.method === "GET") {
      const productsResult = await env.DB.prepare(
        `
        SELECT id, name, slug, description, price, currency, category, active, created_at
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
        INSERT INTO products (name, slug, description, price, currency, category, active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
      )
        .bind(
          body.name,
          body.slug,
          body.description ?? null,
          body.price,
          body.currency ?? "HUF",
          body.category,
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
        SET name = ?, slug = ?, description = ?, price = ?, currency = ?, category = ?, active = ?
        WHERE id = ?
        `,
      )
        .bind(
          body.name,
          body.slug,
          body.description ?? null,
          body.price,
          body.currency ?? "HUF",
          body.category,
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
        INSERT INTO product_variants (product_id, size, cut, stock, sku)
        VALUES (?, ?, ?, ?, ?)
        `,
      )
        .bind(productId, body.size, body.cut ?? "unisex", body.stock, body.sku ?? null)
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
        "UPDATE product_variants SET size = ?, cut = ?, stock = ?, sku = ? WHERE id = ?",
      )
        .bind(body.size, body.cut ?? "unisex", body.stock, body.sku ?? null, variantId)
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

    if (variantAdjustMatch && request.method === "POST") {
      const variantId = Number(variantAdjustMatch[1]);
      const body = await request.json().catch(() => null);
      const delta = (body as Record<string, unknown> | null)?.delta;

      if (!Number.isInteger(delta)) {
        return Response.json(
          { error: "Hiányzó vagy érvénytelen adatok." },
          { status: 400 },
        );
      }

      const result = await env.DB.prepare(
        "UPDATE product_variants SET stock = MAX(stock + ?, 0) WHERE id = ?",
      )
        .bind(delta as number, variantId)
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
      const optimized = await optimizeProductImage(env, file);

      await env.dystopia_merch_images.put(objectKey, optimized.body, {
        httpMetadata: {
          contentType: optimized.contentType,
          cacheControl: "public, max-age=31536000, immutable",
        },
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

    if (orderIdMatch && request.method === "PATCH") {
      const orderId = Number(orderIdMatch[1]);
      const body = await request.json().catch(() => null);

      if (!body || typeof body !== "object") {
        return Response.json(
          { error: "Hiányzó vagy érvénytelen adatok." },
          { status: 400 },
        );
      }

      const { processing, shipped } = body as Record<string, unknown>;

      if (
        (processing === undefined && shipped === undefined) ||
        (processing !== undefined && typeof processing !== "boolean") ||
        (shipped !== undefined && typeof shipped !== "boolean")
      ) {
        return Response.json(
          { error: "Hiányzó vagy érvénytelen adatok." },
          { status: 400 },
        );
      }

      const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?")
        .bind(orderId)
        .first<OrderRow>();

      if (!order) {
        return Response.json({ error: "A rendelés nem található." }, { status: 404 });
      }

      const updates: string[] = [];
      const values: (number)[] = [];

      if (processing !== undefined) {
        updates.push("processing = ?");
        values.push(processing ? 1 : 0);
      }

      if (shipped !== undefined) {
        updates.push("shipped = ?");
        values.push(shipped ? 1 : 0);
      }

      await env.DB.prepare(
        `UPDATE orders SET ${updates.join(", ")} WHERE id = ?`,
      )
        .bind(...values, orderId)
        .run();

      if (
        (processing === true && order.processing === 0) ||
        (shipped === true && order.shipped === 0)
      ) {
        const items = (
          await env.DB.prepare("SELECT * FROM order_items WHERE order_id = ?")
            .bind(orderId)
            .all<OrderItemRow>()
        ).results;

        if (processing === true && order.processing === 0) {
          await sendOrderProcessingEmail(env, order, items);
        }

        if (shipped === true && order.shipped === 0) {
          await sendOrderShippedEmail(env, order, items);
        }
      }

      return Response.json({ success: true });
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

function concatChunks(chunks: Uint8Array[], totalLength: number): Uint8Array {
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

async function serveRangeRequest(
  request: Request,
  env: Env,
  rangeHeader: string,
): Promise<Response> {
  const url = new URL(request.url);
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const cache = caches.default;

  let fullResponse = await cache.match(cacheKey);

  if (!fullResponse) {
    const originResponse = await env.ASSETS.fetch(
      new Request(url.toString(), { method: "GET" }),
    );

    if (!originResponse.ok) {
      return originResponse;
    }

    const cacheHeaders = new Headers(originResponse.headers);
    cacheHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

    await cache.put(
      cacheKey,
      new Response(originResponse.body, { status: 200, headers: cacheHeaders }),
    );

    // Re-read from the cache rather than slicing the live stream directly:
    // on a cold fetch, the asset origin doesn't always report a reliable
    // Content-Length on the in-flight stream, but the cached copy (written
    // above) always does once fully stored.
    fullResponse = await cache.match(cacheKey);

    if (!fullResponse) {
      return env.ASSETS.fetch(request);
    }
  }

  const totalSize = parseInt(fullResponse.headers.get("Content-Length") ?? "", 10);

  if (!Number.isFinite(totalSize) || !fullResponse.body) {
    return fullResponse;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!match) {
    return fullResponse;
  }

  const [, startStr, endStr] = match;
  let start = startStr ? parseInt(startStr, 10) : 0;
  let end = endStr ? parseInt(endStr, 10) : totalSize - 1;

  if (!startStr && endStr) {
    // suffix range, e.g. bytes=-500
    start = totalSize - parseInt(endStr, 10);
    end = totalSize - 1;
  }

  start = Math.max(0, start);
  end = Math.min(totalSize - 1, end);

  if (start > end || start >= totalSize) {
    return new Response(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${totalSize}`,
      },
    });
  }

  // Stream through the cached body and keep only the requested byte range in
  // memory, instead of buffering the whole file for every range request.
  const reader = fullResponse.body.getReader();
  const chunks: Uint8Array[] = [];
  let collected = 0;
  let position = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunkStart = position;
    const chunkEnd = position + value.byteLength;
    position = chunkEnd;

    if (chunkEnd <= start) continue;

    if (chunkStart > end) {
      await reader.cancel();
      break;
    }

    const sliceStart = Math.max(0, start - chunkStart);
    const sliceEnd = Math.min(value.byteLength, end + 1 - chunkStart);
    const slice = value.slice(sliceStart, sliceEnd);
    chunks.push(slice);
    collected += slice.byteLength;

    if (chunkEnd > end) {
      await reader.cancel();
      break;
    }
  }

  const body = concatChunks(chunks, collected);
  const headers = new Headers(fullResponse.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${totalSize}`);
  headers.set("Content-Length", String(body.byteLength));
  headers.set("Accept-Ranges", "bytes");

  return new Response(body, {
    status: 206,
    headers,
  });
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
                currency,
                category
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

        if (!headers.has("Cache-Control")) {
          // Legacy uploads stored before Cache-Control was set at upload
          // time. The object key includes a random UUID per upload, so its
          // content never changes — safe to cache indefinitely.
          headers.set("Cache-Control", "public, max-age=31536000, immutable");
        }

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

    const rangeHeader = request.headers.get("Range");
    if (rangeHeader && /\.(mp4|webm|mov)$/i.test(url.pathname)) {
      return serveRangeRequest(request, env, rangeHeader);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
