"use strict";

const productPage = document.getElementById("productPage");
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const product =
  typeof WOODORA_PRODUCTS !== "undefined" ? WOODORA_PRODUCTS[productId] : null;
const whatsappNumber = "919876543210";

function renderNotFound() {
  productPage.innerHTML = `
    <section class="not-found-box">
      <div class="container">
        <p class="category-kicker">Product Not Found</p>
        <h1 class="h1">Sorry, this product is not available.</h1>
        <p class="section-text">
          Please return to the collection page and choose another product.
        </p>

        <a href="index.html#collection" class="btn">
          <span class="span">Back to Collections</span>
        </a>
      </div>
    </section>
  `;
  requestAnimationFrame(() => {
    document.body.classList.remove("product-page-loading");
    document.body.classList.add("product-page-loaded");
  });
}

function relatedCards(product) {
  return product.related
    .map((id) => {
      const item = WOODORA_PRODUCTS[id];

      if (!item) return "";

      return `
      <article class="related-card">
        <a href="product-details.html?id=${item.id}">
          <figure>
            <img
              src="${item.image}"
              alt="${item.name}"
              loading="lazy"
            >
          </figure>

          <div class="related-card-content">
            <p class="product-badge">${item.badge}</p>

            <h3 class="h3 related-card-title">
              ${item.name}
            </h3>

            <span class="product-link">
              <span>View Details</span>
            </span>
          </div>
        </a>
      </article>
      `;
    })
    .join("");
}

function renderProduct(product) {
  document.title = `${product.name} - Woodora Living`;

  const whatsAppText = encodeURIComponent(
    `Hello Woodora Living, I am interested in ${product.name}. Please share details and quotation.`,
  );

  productPage.innerHTML = `
  <article>

    <section
      class="product-details-hero"
      style="background-image:
      linear-gradient(
      135deg,
      hsla(20,31%,16%,.94),
      hsla(20,31%,26%,.82)),
      url('${product.image}')">

      <div class="container">

        <div class="breadcrumb">
          <a href="index.html#home">Home</a>
          <span>/</span>
          <a href="${product.page}">
            ${product.categoryLabel}
          </a>
          <span>/</span>
          <span>${product.name}</span>
        </div>

        <p class="category-kicker">
          ${product.collection}
        </p>

        <h1 class="h1 product-details-title">
          ${product.name}
        </h1>

        <p class="product-details-subtitle">
          ${product.shortDescription}
        </p>

        <div class="product-details-actions">

          <a href="index.html#contact" class="btn">
            <span class="span">Get Quote</span>
          </a>

          <a
            href="https://wa.me/${whatsappNumber}?text=${whatsAppText}"
            class="btn btn-whatsapp"
            target="_blank">

            <span class="span">
              Chat on WhatsApp
            </span>
          </a>

        </div>

      </div>

    </section>


    <section class="product-details-main">

      <div class="container">

        <div class="product-details-layout">

          <div class="product-gallery-panel">

            <figure class="product-main-image">
              <img
                id="mainProductImage"
                src="${product.image}"
                alt="${product.name}">
            </figure>

          </div>

          <div class="product-info-panel">

            <span class="product-category-pill">
              ${product.categoryLabel}
            </span>

            <h2 class="h2">
              ${product.name}
            </h2>

            <p class="product-short">
              ${product.description}
            </p>

            <div class="product-highlight-list">

              ${product.highlights
                .map(
                  (item) => `
                <div class="product-highlight-item">
                  <span>${item}</span>
                </div>
              `,
                )
                .join("")}

            </div>

          </div>

        </div>

      </div>

    </section>

    <section class="product-content-section">

      <div class="container">

        <div class="product-content-grid">

          <div class="product-content-card">

            <h3 class="h3">
              Key Features
            </h3>

            <ul class="feature-check-list">

              ${product.features
                .map(
                  (item) => `
                <li>
                  <span>${item}</span>
                </li>
              `,
                )
                .join("")}

            </ul>

          </div>

          <div class="product-content-card">

            <h3 class="h3">
              Material
            </h3>

            <p class="material-box">
              ${product.material}
            </p>

            <h3
              class="h3"
              style="margin-top:30px">

              Customization Available

            </h3>

            <p class="material-box">
              ${product.customization}
            </p>

          </div>

        </div>

      </div>

    </section>

    <section class="product-content-section">

      <div class="container">

        <div class="quote-strip">

          <div>

            <p class="category-kicker">
              Why Customers Love This Product
            </p>

            <h2 class="h2">
              ${product.name}
            </h2>

            <p>
              ${product.whyLove}
            </p>

          </div>

        </div>

      </div>

    </section>

    <section class="related-products">

      <div class="container">

        <div class="related-header">

          <div>
            <p class="category-kicker">
              Related Products
            </p>

            <h2 class="h2 section-title">
              You May Also Like
            </h2>
          </div>

        </div>

        <div class="related-grid">
          ${relatedCards(product)}
        </div>

      </div>

    </section>

  </article>
  `;
  requestAnimationFrame(() => {
    document.body.classList.remove("product-page-loading");
    document.body.classList.add("product-page-loaded");
  });
}

if (product) {
  renderProduct(product);
} else {
  renderNotFound();
}
