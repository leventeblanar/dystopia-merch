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

        const products = await Promise.all(
            productsResult.results.map(async (product) => {
            const variantsResult = await env.DB
                .prepare(`
                SELECT
                    id,
                    product_id,
                    size,
                    stock,
                    sku
                FROM product_variants
                WHERE product_id = ?
                ORDER BY id
                `)
                .bind(product.id)
                .all<VariantRow>();

            const imagesResult = await env.DB
                .prepare(`
                SELECT
                    id,
                    product_id,
                    object_key,
                    alt_text,
                    sort_order
                FROM product_images
                WHERE product_id = ?
                ORDER BY sort_order
                `)
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
