document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("project-modal");
  const closeBtn = document.querySelector(".modal-close");
  const projectBtns = document.querySelectorAll(".project-card-btn");

  const modalImage = document.getElementById("modal-image");
  const modalTitle = document.getElementById("modal-title");
  const modalCategory = document.getElementById("modal-category");
  const modalDescription = document.getElementById("modal-description");
  const modalMedia = document.getElementById("modal-media");

  const clearAudioPlayer = () => {
    modalMedia.innerHTML = "";
  };

  projectBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modalImage.src = btn.dataset.image;
      modalImage.alt = btn.dataset.title;
      modalTitle.textContent = btn.dataset.title;
      modalCategory.textContent = btn.dataset.category;
      modalDescription.textContent = btn.dataset.description;

      clearAudioPlayer();
      const trackId = btn.dataset.soundcloudId;

      if (trackId) {
        const soundcloudEmbedUrl = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${trackId}&color=%23ff66c4&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;

        modalMedia.innerHTML = `
          <iframe 
            width="100%" 
            height="166" 
            scrolling="no" 
            frameborder="no" 
            allow="autoplay" 
            src="${soundcloudEmbedUrl}">
          </iframe>
        `;
      }

      modal.showModal();
    });
  });

  const closeModal = () => {
    clearAudioPlayer();
    modal.close();
  };

  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    const rect = modal.getBoundingClientRect();
    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      closeModal();
    }
  });

  modal.addEventListener("close", () => {
    clearAudioPlayer();
  });
});
