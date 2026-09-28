const bookSlider =
  document.querySelector("#bookSlider");

const bookCards =
  [...document.querySelectorAll(".book-card")];

const sliderDots =
  document.querySelector("#sliderDots");

const dateWheel =
  document.querySelector("#dateWheel");

const dateSection =
  document.querySelector(".date-section");

const rouletteStatus =
  document.querySelector("#rouletteStatus");

const searchButton =
  document.querySelector("#searchButton");

const selectionMessage =
  document.querySelector("#selectionMessage");

const weekday = [
  "日",
  "月",
  "火",
  "水",
  "木",
  "金",
  "土"
];

let selectedDate;

let rouletteHasRun = false;

/* 画像が読み込めない場合に壊れた画像マークを消す */
function setupImageFallbacks() {
  const images =
    document.querySelectorAll(
      ".campaign-logo, .cover img, .recommend-cover img"
    );

  images.forEach((image) => {
    const hideBrokenImage = () => {
      image.hidden = true;
    };

    image.addEventListener(
      "error",
      hideBrokenImage
    );

    if (
      image.complete &&
      image.naturalWidth === 0
    ) {
      hideBrokenImage();
    }
  });
}

/* 本のスライド下に丸を作る */
function setupSlider() {
  bookCards.forEach((_, index) => {
    const dot =
      document.createElement("span");

    if (index === 0) {
      dot.classList.add("is-active");
    }

    sliderDots.append(dot);
  });

  const dots =
    [...sliderDots.children];

  const updateDots = () => {
    const cardWidth =
      bookCards[0]
        .getBoundingClientRect()
        .width + 12;

    const activeIndex =
      Math.min(
        bookCards.length - 1,

        Math.max(
          0,

          Math.round(
            bookSlider.scrollLeft /
            cardWidth
          )
        )
      );

    dots.forEach((dot, index) => {
      dot.classList.toggle(
        "is-active",
        index === activeIndex
      );
    });
  };

  bookSlider.addEventListener(
    "scroll",
    updateDots,
    {
      passive: true
    }
  );
}

/* 日付ルーレットの候補を作る */
function createDateWheel() {
  const start = new Date();

  start.setHours(12, 0, 0, 0);

  /*
    今日から7日後?42日後までの
    日付を作成
  */
  for (
    let offset = 7;
    offset <= 42;
    offset += 1
  ) {
    const date =
      new Date(start);

    date.setDate(
      start.getDate() + offset
    );

    const option =
      document.createElement("button");

    option.type = "button";

    option.className =
      "date-option";

    option.dataset.date =
      date.toISOString();

    option.setAttribute(
      "role",
      "option"
    );

    option.setAttribute(
      "aria-selected",
      "false"
    );

    option.innerHTML = `
      <span>${date.getMonth() + 1}</span>
      <span>${date.getDate()}</span>
      <span>${weekday[date.getDay()]}</span>
    `;

    dateWheel.append(option);
  }

  requestAnimationFrame(() => {
    const initial =
      dateWheel.lastElementChild;

    dateWheel.scrollTop =
      positionFor(initial);

    selectOption(initial);

    setupRouletteObserver();
  });
}

/* 日付をルーレットの中央に合わせる */
function positionFor(option) {
  return (
    option.offsetTop -
    (
      dateWheel.clientHeight -
      option.offsetHeight
    ) /
    2
  );
}

/* 日付を選択状態にする */
function selectOption(option) {
  if (!option) {
    return;
  }

  const options =
    [...dateWheel.children];

  options.forEach((item) => {
    const isSelected =
      item === option;

    item.classList.toggle(
      "is-selected",
      isSelected
    );

    item.setAttribute(
      "aria-selected",
      String(isSelected)
    );
  });

  selectedDate =
    new Date(option.dataset.date);
}

/* 中央に近い日付を取得する */
function selectClosestDate() {
  const options =
    [...dateWheel.children];

  const rowHeight =
    options[0].offsetHeight;

  const index =
    Math.min(
      options.length - 1,

      Math.max(
        0,

        Math.round(
          dateWheel.scrollTop /
          rowHeight
        )
      )
    );

  selectOption(options[index]);
}

/* 自動で日付ルーレットを回す */
function runDateRoulette() {
  if (rouletteHasRun) {
    return;
  }

  rouletteHasRun = true;

  const options =
    [...dateWheel.children];

  /*
    7日後から候補が始まるため、
    index 7で約14日後になる
  */
  const targetIndex = 7;

  const target =
    options[targetIndex];

  const startPosition =
    dateWheel.scrollTop;

  const endPosition =
    positionFor(target);

  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (reducedMotion) {
    dateWheel.scrollTop =
      endPosition;

    selectOption(target);

    showRouletteResult();

    return;
  }

  rouletteStatus.textContent =
    "おすすめ日を選んでいます…";

  const startTime =
    performance.now();

  const duration = 2600;

  const animate = (now) => {
    const progress =
      Math.min(
        1,
        (now - startTime) / duration
      );

    /*
      最初は速く、
      最後はゆっくり止まる
    */
    const eased =
      1 -
      Math.pow(
        1 - progress,
        4
      );

    dateWheel.scrollTop =
      startPosition +
      (
        endPosition -
        startPosition
      ) *
      eased;

    selectClosestDate();

    if (progress < 1) {
      requestAnimationFrame(
        animate
      );
    } else {
      dateWheel.scrollTop =
        endPosition;

      selectOption(target);

      showRouletteResult();
    }
  };

  requestAnimationFrame(
    animate
  );
}

/* 決定した日付を表示する */
function showRouletteResult() {
  const label =
    `${selectedDate.getMonth() + 1}月` +
    `${selectedDate.getDate()}日` +
    `（${weekday[selectedDate.getDay()]}）`;

  rouletteStatus.textContent =
    `おすすめの次回予約日は ${label} です`;
}

/* 日付部分が画面に入ったらルーレットを回す */
function setupRouletteObserver() {
  const observer =
    new IntersectionObserver(
      (entries) => {
        const isVisible =
          entries.some(
            (entry) =>
              entry.isIntersecting
          );

        if (isVisible) {
          runDateRoulette();

          observer.disconnect();
        }
      },

      {
        threshold: 0.55
      }
    );

  observer.observe(
    dateSection
  );
}

/* 本を探すボタンを押したとき */
searchButton.addEventListener(
  "click",
  () => {
    if (!selectedDate) {
      selectClosestDate();
    }

    const label =
      `${selectedDate.getMonth() + 1}月` +
      `${selectedDate.getDate()}日` +
      `（${weekday[selectedDate.getDay()]}）`;

    selectionMessage.textContent =
      `${label}に受け取れる本を表示します。`;
  }
);

/* 最初に実行 */
setupImageFallbacks();

setupSlider();

createDateWheel();