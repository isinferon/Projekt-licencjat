const galleryItems = document.querySelector(".gallery--items").children;
const prev = document.querySelectorAll(".prev");
const next = document.querySelectorAll(".next");
const page = document.querySelectorAll(".page-num");
let index = 1;
const maxItem = 5;

const pagination = Math.ceil(galleryItems.length / maxItem);

prev[0].addEventListener("click", function () {
  index--;
  check();
  window.scrollTo(0, 0);
  showItems();
});
prev[1].addEventListener("click", function () {
  index--;
  check();
  window.scrollTo(0, 0);
  showItems();
});
next[0].addEventListener("click", function () {
  index++;
  check();
  window.scrollTo(0, 0);
  showItems();
});
next[1].addEventListener("click", function () {
  index++;
  check();
  window.scrollTo(0, 0);
  showItems();
});

function check() {
  if (index == pagination) {
    next[0].classList.add("disabled");
    next[1].classList.add("disabled");
  } else {
    next[0].classList.remove("disabled");
    next[1].classList.remove("disabled");
  }

  if (index == 1) {
    prev[0].classList.add("disabled");
    prev[1].classList.add("disabled");
  } else {
    prev[0].classList.remove("disabled");
    prev[1].classList.remove("disabled");
  }
}

function showItems() {
  for (let i = 0; i < galleryItems.length; i++) {
    galleryItems[i].classList.remove("show");
    galleryItems[i].classList.add("hide");

    if (i >= index * maxItem - maxItem && i < index * maxItem) {
      galleryItems[i].classList.remove("hide");
      galleryItems[i].classList.add("show");
    }
    page[0].innerHTML = index;
    page[1].innerHTML = index;

  }
}
check();
showItems();
