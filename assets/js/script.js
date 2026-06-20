"use strict";

/**
 * Add event listener on multiple elements
 */

const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    elements[i].addEventListener(eventType, callback);
  }
};

/**
 * MOBILE NAVBAR TOGGLE
 */

const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const overlay = document.querySelector("[data-overlay]");

const toggleNav = function () {
  navbar.classList.toggle("active");
  overlay.classList.toggle("active");
};

addEventOnElements(navTogglers, "click", toggleNav);

/**
 * ACTIVE HEADER ON SCROLL
 */

const header = document.querySelector("[data-header]");

const headerActive = function () {
  if (window.scrollY > 100) {
    header.classList.add("active");
  } else {
    header.classList.remove("active");
  }
};

window.addEventListener("scroll", headerActive);

/**
 * COLLECTION SLIDER
 */

const collectionSlider = document.getElementById("collectionSlider");
const collectionPrev = document.getElementById("collectionPrev");
const collectionNext = document.getElementById("collectionNext");

if (collectionSlider && collectionPrev && collectionNext) {
  const updateCollectionArrows = () => {
    const maxScrollLeft =
      collectionSlider.scrollWidth - collectionSlider.clientWidth;

    collectionPrev.disabled = collectionSlider.scrollLeft <= 5;
    collectionNext.disabled = collectionSlider.scrollLeft >= maxScrollLeft - 5;
  };

  collectionNext.addEventListener("click", () => {
    collectionSlider.scrollBy({
      left: collectionSlider.clientWidth,
      behavior: "smooth",
    });

    setTimeout(updateCollectionArrows, 350);
  });

  collectionPrev.addEventListener("click", () => {
    collectionSlider.scrollBy({
      left: -collectionSlider.clientWidth,
      behavior: "smooth",
    });

    setTimeout(updateCollectionArrows, 350);
  });

  collectionSlider.addEventListener("scroll", updateCollectionArrows);
  window.addEventListener("resize", updateCollectionArrows);

  updateCollectionArrows();
}

/**
 * BLOG SLIDER: moves blog cards and disables arrows at start/end.
 */

const blogSlider = document.getElementById("blogSlider");
const blogPrev = document.getElementById("blogPrev");
const blogNext = document.getElementById("blogNext");

if (blogSlider && blogPrev && blogNext) {
  const updateBlogArrows = () => {
    const maxScrollLeft = blogSlider.scrollWidth - blogSlider.clientWidth;

    blogPrev.disabled = blogSlider.scrollLeft <= 5;
    blogNext.disabled = blogSlider.scrollLeft >= maxScrollLeft - 5;
  };

  blogNext.addEventListener("click", () => {
    blogSlider.scrollBy({
      left: blogSlider.clientWidth,
      behavior: "smooth",
    });

    setTimeout(updateBlogArrows, 350);
  });

  blogPrev.addEventListener("click", () => {
    blogSlider.scrollBy({
      left: -blogSlider.clientWidth,
      behavior: "smooth",
    });

    setTimeout(updateBlogArrows, 350);
  });

  blogSlider.addEventListener("scroll", updateBlogArrows);
  window.addEventListener("resize", updateBlogArrows);

  updateBlogArrows();
}

/**
 * PROJECT MODAL: opens project details, expands same-project gallery,
 * sends quote users to Contact, and keeps WhatsApp as an external chat action.
 */

const projectData = {
  living: {
    room: "Living Room Project",
    title: "Modern Family Living Room",
    story:
      "A warm and elegant living room designed with premium seating, a wooden center table, and a coordinated entertainment setup for everyday comfort.",
    images: [
      "./assets/images/projects/living-project-1.webp",
      "./assets/images/projects/living-project-2.webp",
      "./assets/images/projects/living-project-3.webp",
    ],
    furniture: [
      "Premium L-Shape Sofa Set",
      "Wooden Center Table",
      "TV Unit Storage",
      "Accent Lounge Chair",
    ],
  },

  dining: {
    room: "Dining Room Project",
    title: "Elegant Dining Space",
    story:
      "A refined dining setup created for family gatherings with premium dining furniture, warm lighting, and a clean modern finish.",
    images: [
      "./assets/images/projects/dining-project-1.webp",
      "./assets/images/projects/dining-project-2.webp",
      "./assets/images/projects/dining-project-3.webp",
    ],
    furniture: [
      "6-Seater Dining Set",
      "Marble Top Dining Table",
      "Premium Crockery Unit",
      "Dining Console Cabinet",
    ],
  },

  bedroom: {
    room: "Bedroom Project",
    title: "Premium Bedroom Interior",
    story:
      "A calm and luxurious bedroom space planned with premium bed design, smart storage, and elegant finishing for daily comfort.",
    images: [
      "./assets/images/projects/bedroom-project-1.webp",
      "./assets/images/projects/bedroom-project-2.webp",
      "./assets/images/projects/bedroom-project-3.webp",
    ],
    furniture: [
      "King Size Bed",
      "Bedside Table Set",
      "Modern Dressing Table",
      "Bedroom Wardrobe",
    ],
  },

  wardrobe: {
    room: "Storage Project",
    title: "Smart Storage Solution",
    story:
      "A practical and stylish storage solution designed with wardrobes, shelving, and organized compartments for a cleaner home.",
    images: [
      "./assets/images/projects/wardrobe-project-1.webp",
      "./assets/images/projects/wardrobe-project-2.webp",
      "./assets/images/projects/wardrobe-project-3.webp",
    ],
    furniture: [
      "Sliding Wardrobe",
      "Wardrobe With Mirror",
      "Storage Cabinet",
      "Corner Storage Solution",
    ],
  },
};

const projectModal = document.getElementById("projectModal");
const projectLinks = document.querySelectorAll("[data-project]");
const projectCloseBtns = document.querySelectorAll("[data-project-close]");

const projectRoom = document.getElementById("projectRoom");
const projectTitle = document.getElementById("projectTitle");
const projectStory = document.getElementById("projectStory");
const projectImages = document.getElementById("projectImages");
const projectFurniture = document.getElementById("projectFurniture");
const projectMoreBtn = document.getElementById("projectMoreBtn");
const projectBackBtn = document.getElementById("projectBackBtn");
const projectContactBtn = document.querySelector(".project-contact-btn");

// PROJECT MODAL: extra gallery overlay controls
const projectDesignLightbox = document.getElementById("projectDesignLightbox");
const projectDesignGrid = document.getElementById("projectDesignGrid");
const projectDesignClose = document.getElementById("projectDesignClose");

// PROJECT MODAL: dynamic more-designs heading
const projectDesignTitle = document.getElementById("projectDesignTitle");

let activeProject = null;
let isProjectGalleryExpanded = false;

function renderProjectImages(project, expanded = false) {
  if (!projectImages || !project) return;

  const images = expanded
    ? [...project.images, ...project.images]
    : project.images;

  projectImages.classList.toggle("expanded", expanded);

  projectImages.innerHTML = images
    .map((image) => `<img src="${image}" alt="${project.title}" />`)
    .join("");
}

function closeProjectPopup() {
  if (!projectModal) return;

  projectModal.classList.remove("active");
  document.body.style.overflow = "";
  isProjectGalleryExpanded = false;

  if (projectMoreBtn) {
    projectMoreBtn.querySelector(".span").textContent = "View More Designs";
  }

  if (projectImages) {
    projectImages.classList.remove("expanded");
  }
  if (projectDesignLightbox) {
    projectDesignLightbox.classList.remove("active");
  }
}

function closeProjectPopupAndScroll(targetId) {
  closeProjectPopup();

  setTimeout(() => {
    const targetSection = document.querySelector(targetId);

    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, 250);
}

projectLinks.forEach((link) => {
  link.addEventListener("click", function (event) {
    event.preventDefault();

    const project = projectData[this.dataset.project];

    if (!project) return;

    activeProject = project;
    isProjectGalleryExpanded = false;

    projectRoom.textContent = project.room;
    projectTitle.textContent = project.title;
    projectStory.textContent = project.story;

    renderProjectImages(project, false);

    projectFurniture.innerHTML = project.furniture
      .map((item) => `<li>✓ ${item}</li>`)
      .join("");

    if (projectMoreBtn) {
      projectMoreBtn.querySelector(".span").textContent = "View More Designs";
    }

    projectModal.classList.add("active");
    document.body.style.overflow = "hidden";
  });
});

projectCloseBtns.forEach((btn) => {
  btn.addEventListener("click", closeProjectPopup);
});

// PROJECT MODAL: opens more designs as an overlay above the active project popup
if (projectMoreBtn) {
  projectMoreBtn.addEventListener("click", function () {
    if (!activeProject || !projectDesignLightbox || !projectDesignGrid) return;

    const designImages = activeProject.moreImages || [
      ...activeProject.images,
      ...activeProject.images,
    ];

    projectDesignGrid.innerHTML = designImages
      .map((image) => `<img src="${image}" alt="${activeProject.title}" />`)
      .join("");

    if (projectDesignTitle) {
      projectDesignTitle.textContent = `More ${activeProject.title} Designs`;
    }

    projectDesignLightbox.classList.add("active");
  });
}

if (projectDesignClose) {
  projectDesignClose.addEventListener("click", function () {
    projectDesignLightbox.classList.remove("active");
  });
}

// PROJECT MODAL: quote and back actions
if (projectContactBtn) {
  projectContactBtn.addEventListener("click", function (event) {
    event.preventDefault();
    closeProjectPopupAndScroll("#contact");
  });
}

if (projectBackBtn) {
  projectBackBtn.addEventListener("click", function () {
    closeProjectPopupAndScroll("#gallery");
  });
}

/**
 * TESTIMONIAL SLIDER: moves testimonial cards and disables arrows at start/end.
 */

const testimonialSlider = document.querySelector(".testimonial-slider");
const testimonialList = document.querySelector(".testimonial-list");
const testimonialCards = document.querySelectorAll(".testimonial-card");
const testimonialPrev = document.getElementById("testimonial-prev");
const testimonialNext = document.getElementById("testimonial-next");

if (
  testimonialSlider &&
  testimonialList &&
  testimonialCards.length &&
  testimonialPrev &&
  testimonialNext
) {
  let testimonialIndex = 0;

  function getVisibleCards() {
    if (window.innerWidth <= 767) return 1;
    if (window.innerWidth <= 991) return 2;
    return 3;
  }

  function updateTestimonialArrows(maxIndex) {
    testimonialPrev.disabled = testimonialIndex === 0;
    testimonialNext.disabled = testimonialIndex >= maxIndex;
  }

  function updateTestimonials() {
    const card = testimonialCards[0];
    const gap = 26;
    const cardWidth = card.offsetWidth + gap;
    const visible = getVisibleCards();
    const maxIndex = Math.max(testimonialCards.length - visible, 0);

    if (testimonialIndex > maxIndex) testimonialIndex = maxIndex;
    if (testimonialIndex < 0) testimonialIndex = 0;

    testimonialList.style.transform = `translateX(-${
      testimonialIndex * cardWidth
    }px)`;

    updateTestimonialArrows(maxIndex);
  }

  testimonialNext.addEventListener("click", () => {
    if (testimonialNext.disabled) return;

    testimonialIndex++;
    updateTestimonials();
  });

  testimonialPrev.addEventListener("click", () => {
    if (testimonialPrev.disabled) return;

    testimonialIndex--;
    updateTestimonials();
  });

  window.addEventListener("resize", updateTestimonials);

  updateTestimonials();
}

/**
 * CONTACT FORM
 */

const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

if (contactForm && formMessage) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const data = {
      name: document.getElementById("fullName").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      requirement: document.getElementById("requirement").value,
      message: document.getElementById("message").value,
    };

    try {
      formMessage.textContent = "Submitting...";
      formMessage.className = "form-message show";

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        formMessage.textContent = "Enquiry submitted successfully!";
        formMessage.style.color = "green";
        formMessage.className = "form-message success show";
        contactForm.reset();

        setTimeout(() => {
          formMessage.classList.remove("show");

          setTimeout(() => {
            formMessage.textContent = "";
            formMessage.className = "form-message";
            formMessage.style.color = "";
          }, 300);
        }, 3000);
      } else {
        console.log(result);
        formMessage.textContent = result.message || "Something went wrong";
        formMessage.className = "form-message error show";
      }
    } catch (error) {
      console.log(error);
      formMessage.textContent = "Something went wrong";
      formMessage.className = "form-message error show";
    }
  });
}

const phoneInput = document.getElementById("phone");

if (phoneInput) {
  phoneInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "").slice(0, 10);
  });
}
