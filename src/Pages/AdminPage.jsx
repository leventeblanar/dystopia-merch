import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  SIZELESS_VARIANT_LABEL,
  VARIANT_CUTS,
  CUT_LABELS,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  formatSizeCutLabel,
} from "../../shared/constants";

import "./AdminPage.css";

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? "Hiba történt a kérés feldolgozása közben.");
  }

  return data;
}

const emptyProductForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  currency: "HUF",
  category: PRODUCT_CATEGORIES[0],
  active: true,
};

function ProductForm({ initialValue, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialValue ?? emptyProductForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (event) => {
    const value =
      field === "active" ? event.target.checked : event.target.value;

    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        price: Number(form.price),
        currency: form.currency || "HUF",
        category: form.category,
        active: Boolean(form.active),
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-field-row">
        <div className="admin-field">
          <label>Név</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={handleChange("name")}
          />
        </div>

        <div className="admin-field">
          <label>Slug</label>
          <input
            type="text"
            required
            value={form.slug}
            onChange={handleChange("slug")}
          />
        </div>
      </div>

      <div className="admin-field">
        <label>Leírás</label>
        <textarea
          rows={3}
          value={form.description ?? ""}
          onChange={handleChange("description")}
        />
      </div>

      <div className="admin-field-row">
        <div className="admin-field">
          <label>Ár (Ft)</label>
          <input
            type="number"
            min="0"
            required
            value={form.price}
            onChange={handleChange("price")}
          />
        </div>

        <div className="admin-field admin-field--narrow">
          <label>Pénznem</label>
          <input
            type="text"
            value={form.currency}
            onChange={handleChange("currency")}
          />
        </div>

        <div className="admin-field admin-field--narrow">
          <label>Kategória</label>
          <select
            value={form.category}
            onChange={handleChange("category")}
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {PRODUCT_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>

        <label className="admin-checkbox-field">
          <input
            type="checkbox"
            checked={Boolean(form.active)}
            onChange={handleChange("active")}
          />
          Aktív
        </label>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? "Mentés..." : submitLabel}
        </button>

        {onCancel && (
          <button type="button" className="admin-button-secondary" onClick={onCancel}>
            Mégse
          </button>
        )}
      </div>
    </form>
  );
}

function VariantEditor({ productId, variants, onChanged }) {
  const [form, setForm] = useState({ size: "", cut: "unisex", stock: "", sku: "" });
  const [sizeless, setSizeless] = useState(false);
  const [error, setError] = useState(null);
  const [adjustDrafts, setAdjustDrafts] = useState({});

  const hasSizelessVariant = variants.some(
    (variant) => variant.size === SIZELESS_VARIANT_LABEL,
  );
  const canOfferSizeless = variants.length === 0;

  const handleAdd = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: sizeless ? SIZELESS_VARIANT_LABEL : form.size,
          cut: sizeless ? "unisex" : form.cut,
          stock: Number(form.stock),
          sku: form.sku || null,
        }),
      });

      await parseJsonResponse(response);
      setForm({ size: "", cut: "unisex", stock: "", sku: "" });
      setSizeless(false);
      onChanged();
    } catch (addError) {
      setError(addError.message);
    }
  };

  const handleStockChange = async (variant, stock) => {
    try {
      const response = await fetch(`/api/admin/variants/${variant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: variant.size,
          cut: variant.cut,
          stock: Number(stock),
          sku: variant.sku,
        }),
      });

      await parseJsonResponse(response);
      onChanged();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const handleAdjustStock = async (variant) => {
    const delta = Number(adjustDrafts[variant.id]);

    if (!Number.isInteger(delta) || delta === 0) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/variants/${variant.id}/adjust-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });

      await parseJsonResponse(response);
      setAdjustDrafts((current) => ({ ...current, [variant.id]: "" }));
      onChanged();
    } catch (adjustError) {
      setError(adjustError.message);
    }
  };

  const handleDelete = async (variant) => {
    try {
      const response = await fetch(`/api/admin/variants/${variant.id}`, {
        method: "DELETE",
      });

      await parseJsonResponse(response);
      onChanged();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <div className="admin-variants">
      <p className="admin-subheading">
        {hasSizelessVariant ? "Készlet" : "Méretek / készlet"}
      </p>

      <table className="admin-table admin-table--compact">
        <thead>
          <tr>
            <th>Méret</th>
            <th>Szabás</th>
            <th>Készlet</th>
            <th>SKU</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {variants.map((variant) => (
            <tr key={variant.id}>
              <td>{variant.size === SIZELESS_VARIANT_LABEL ? "—" : variant.size}</td>
              <td>
                {variant.size === SIZELESS_VARIANT_LABEL
                  ? "—"
                  : (CUT_LABELS[variant.cut] ?? variant.cut)}
              </td>
              <td>
                <div className="admin-stock-cell">
                  <input
                    type="number"
                    min="0"
                    defaultValue={variant.stock}
                    onBlur={(event) =>
                      handleStockChange(variant, event.target.value)
                    }
                  />

                  <div className="admin-stock-adjust">
                    <input
                      type="number"
                      placeholder="+db"
                      value={adjustDrafts[variant.id] ?? ""}
                      onChange={(event) =>
                        setAdjustDrafts((current) => ({
                          ...current,
                          [variant.id]: event.target.value,
                        }))
                      }
                    />

                    <button
                      type="button"
                      className="admin-button-add"
                      onClick={() => handleAdjustStock(variant)}
                    >
                      Hozzáad
                    </button>
                  </div>
                </div>
              </td>
              <td>{variant.sku ?? "—"}</td>
              <td>
                <button
                  type="button"
                  className="admin-button-danger"
                  onClick={() => handleDelete(variant)}
                >
                  Törlés
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasSizelessVariant ? (
        <p className="admin-status">
          Ez egy nem méretfüggő termék, a fenti sorban módosíthatod a
          készletét.
        </p>
      ) : (
        <form className="admin-inline-form" onSubmit={handleAdd}>
          {canOfferSizeless && (
            <label className="admin-checkbox-field">
              <input
                type="checkbox"
                checked={sizeless}
                onChange={(event) => setSizeless(event.target.checked)}
              />
              Nem méretfüggő termék (pl. kulcstartó)
            </label>
          )}

          {!sizeless && (
            <input
              type="text"
              placeholder="Méret (pl. M)"
              required
              value={form.size}
              onChange={(event) =>
                setForm((current) => ({ ...current, size: event.target.value }))
              }
            />
          )}

          {!sizeless && (
            <select
              value={form.cut}
              onChange={(event) =>
                setForm((current) => ({ ...current, cut: event.target.value }))
              }
            >
              {VARIANT_CUTS.map((cut) => (
                <option key={cut} value={cut}>
                  {CUT_LABELS[cut]}
                </option>
              ))}
            </select>
          )}

          <input
            type="number"
            placeholder="Készlet"
            min="0"
            required
            value={form.stock}
            onChange={(event) =>
              setForm((current) => ({ ...current, stock: event.target.value }))
            }
          />

          <input
            type="text"
            placeholder="SKU (opcionális)"
            value={form.sku}
            onChange={(event) =>
              setForm((current) => ({ ...current, sku: event.target.value }))
            }
          />

          <button type="submit">
            {sizeless ? "Termék hozzáadása" : "Méret hozzáadása"}
          </button>
        </form>
      )}

      {error && <p className="admin-error">{error}</p>}
    </div>
  );
}

function ImageManager({ productId, images, onChanged }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sortOrder", String(images.length));

      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: formData,
      });

      await parseJsonResponse(response);
      onChanged();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (image) => {
    try {
      const response = await fetch(`/api/admin/images/${image.id}`, {
        method: "DELETE",
      });

      await parseJsonResponse(response);
      onChanged();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <div className="admin-images">
      <p className="admin-subheading">Képek</p>

      <div className="admin-image-list">
        {images.map((image) => (
          <div className="admin-image-item" key={image.id}>
            <img src={image.url} alt={image.alt_text ?? ""} />
            <button
              type="button"
              className="admin-button-danger"
              onClick={() => handleDelete(image)}
            >
              Törlés
            </button>
          </div>
        ))}
      </div>

      <label className="admin-upload-label">
        {uploading ? "Feltöltés..." : "Kép feltöltése"}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          hidden
        />
      </label>

      {error && <p className="admin-error">{error}</p>}
    </div>
  );
}

function ProductRow({ product, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);

  const handleUpdate = async (values) => {
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    await parseJsonResponse(response);
    setEditing(false);
    onChanged();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Biztosan törlöd: "${product.name}"? Ez minden méretét és képét is törli.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      await parseJsonResponse(response);
      onChanged();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <div className="admin-product-card">
      <div className="admin-product-summary">
        <img
          className="admin-product-thumb"
          src={product.images?.[0]?.url}
          alt=""
        />

        <div className="admin-product-info">
          <strong>{product.name}</strong>
          <span>{product.slug}</span>
          <span>
            {Number(product.price).toLocaleString("hu-HU")} {product.currency}
          </span>
          <span>{PRODUCT_CATEGORY_LABELS[product.category] ?? product.category}</span>
          <span className={product.active ? "admin-badge-active" : "admin-badge-inactive"}>
            {product.active ? "Aktív" : "Inaktív"}
          </span>
        </div>

        <div className="admin-product-actions">
          <button type="button" onClick={() => setExpanded((current) => !current)}>
            {expanded ? "Bezárás" : "Részletek"}
          </button>
          <button type="button" onClick={() => setEditing((current) => !current)}>
            Szerkesztés
          </button>
          <button type="button" className="admin-button-danger" onClick={handleDelete}>
            Törlés
          </button>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {editing && (
        <ProductForm
          initialValue={{
            name: product.name,
            slug: product.slug,
            description: product.description ?? "",
            price: String(product.price),
            currency: product.currency,
            category: product.category,
            active: Boolean(product.active),
          }}
          submitLabel="Mentés"
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      )}

      {expanded && (
        <div className="admin-product-details">
          <VariantEditor
            productId={product.id}
            variants={product.variants ?? []}
            onChanged={onChanged}
          />

          <ImageManager
            productId={product.id}
            images={product.images ?? []}
            onChanged={onChanged}
          />
        </div>
      )}
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey((current) => current + 1);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/admin/products");
        const data = await parseJsonResponse(response);
        setProducts(data);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [reloadKey]);

  const handleCreate = async (values) => {
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    await parseJsonResponse(response);
    setCreating(false);
    reload();
  };

  return (
    <div className="admin-tab">
      <div className="admin-tab-header">
        <h2>Termékek</h2>

        <div className="admin-tab-header-actions">
          <button type="button" onClick={reload}>
            Frissítés
          </button>

          <button type="button" onClick={() => setCreating((current) => !current)}>
            {creating ? "Mégse" : "Új termék"}
          </button>
        </div>
      </div>

      {creating && (
        <ProductForm
          submitLabel="Létrehozás"
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {loading && <p className="admin-status">Betöltés...</p>}
      {error && <p className="admin-error">{error}</p>}

      {!loading &&
        !error &&
        products.map((product) => (
          <ProductRow key={product.id} product={product} onChanged={reload} />
        ))}
    </div>
  );
}

const ORDER_STATUS_LABELS = {
  pending: "Függő",
  paid: "Kifizetve",
  failed: "Sikertelen",
  cancelled: "Törölve",
};

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const handleToggleFulfillment = async (order, field) => {
    const nextValue = !order[field];

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextValue }),
      });
      await parseJsonResponse(response);

      setOrders((current) =>
        current.map((existingOrder) =>
          existingOrder.id === order.id
            ? { ...existingOrder, [field]: nextValue ? 1 : 0 }
            : existingOrder,
        ),
      );
    } catch (toggleError) {
      setError(toggleError.message);
    }
  };

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetch("/api/admin/orders");
        const data = await parseJsonResponse(response);
        setOrders(data);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  return (
    <div className="admin-tab">
      <div className="admin-tab-header">
        <h2>Rendelések</h2>
      </div>

      {loading && <p className="admin-status">Betöltés...</p>}
      {error && <p className="admin-error">{error}</p>}

      {!loading && !error && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ügyfél</th>
              <th>Cím</th>
              <th>Összeg</th>
              <th>Státusz</th>
              <th>Feldolgozás alatt</th>
              <th>Feladva</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <>
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>
                    {order.customer_name}
                    <br />
                    <small>{order.customer_email} · {order.customer_phone}</small>
                  </td>
                  <td>
                    {order.shipping_postal_code} {order.shipping_city}
                    <br />
                    <small>{order.shipping_street_address}</small>
                  </td>
                  <td>
                    {Number(order.total_amount).toLocaleString("hu-HU")} {order.currency}
                  </td>
                  <td>
                    <span className={`admin-order-status admin-order-status--${order.status}`}>
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(order.processing)}
                      onChange={() => handleToggleFulfillment(order, "processing")}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(order.shipped)}
                      onChange={() => handleToggleFulfillment(order, "shipped")}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-order-toggle"
                      onClick={() =>
                        setExpandedOrderId((current) =>
                          current === order.id ? null : order.id,
                        )
                      }
                    >
                      {expandedOrderId === order.id ? "Bezárás" : "Tételek"}
                    </button>
                  </td>
                </tr>

                {expandedOrderId === order.id && (
                  <tr key={`${order.id}-details`}>
                    <td colSpan={8}>
                      <ul className="admin-order-items">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            {item.product_name}
                            {item.variant_size !== SIZELESS_VARIANT_LABEL &&
                              ` (${formatSizeCutLabel(item.variant_size, item.variant_cut)})`}{" "}
                            × {item.quantity} —{" "}
                            {(item.unit_price * item.quantity).toLocaleString("hu-HU")}{" "}
                            {order.currency}
                          </li>
                        ))}
                      </ul>
                      {order.shipping_note && (
                        <p className="admin-order-note">Megjegyzés: {order.shipping_note}</p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AdminPage() {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link className="admin-back" to="/">
          Vissza az oldalra
        </Link>

        <h1>Admin felület</h1>

        <nav className="admin-nav">
          <button
            type="button"
            className={activeTab === "products" ? "admin-nav-active" : ""}
            onClick={() => setActiveTab("products")}
          >
            Termékek
          </button>
          <button
            type="button"
            className={activeTab === "orders" ? "admin-nav-active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            Rendelések
          </button>
        </nav>

        <a className="admin-logout" href="/cdn-cgi/access/logout">
          Kijelentkezés
        </a>
      </header>

      {activeTab === "products" ? <ProductsTab /> : <OrdersTab />}
    </main>
  );
}

export default AdminPage;
