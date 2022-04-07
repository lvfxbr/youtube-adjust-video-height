const youtubeVideoContainerSelector = "#container.ytd-player";
const youtubeTheaterContainerSelector = "#player-theater-container";
const youtubeHTML5VideoSelector = ".video-stream.html5-main-video";

let mouseIsPressed = false;
let mousePosition;
let badgePosition;
let savedVideoHeight;

function getElement(
    selector,
    callback,
    timeout = 1000,
    maxretries = 5,
    attempt = 1
) {
    if (attempt >= maxretries) {
        throw Error(
            `try to get element with selector '${selector}' but the max retries limit reached (${maxretries}).`
        );
    }

    const element = document.querySelector(selector);

    if (element) {
        callback(element);
        return;
    }

    setTimeout(() => {
        getElement(selector, callback, timeout, maxretries, attempt + 1);
    }, timeout);
}

function createResizeBadge() {
    const badge = document.createElement("div");

    badge.id = "yavh-badge-resize";
    badge.classList.add("yavh-badge-resize");

    document.body.appendChild(badge);

    return badge;
}

function isClosestParent(element, parentElement) {
    if (element.isEqualNode(parentElement)) {
        return element;
    } else if (element.isEqualNode(document.body)) {
        return null;
    }

    return isClosestParent(element.parentElement, parentElement);
}

function getFixedBoudingClientRect(element) {
    let rect = element.getBoundingClientRect();

    const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    const { top, left, width, height } = rect;

    return {
        top: top + scrollTop,
        left: left + scrollLeft,
        width,
        height,
    };
}

function placeBadge(badge, anchor) {
    const anchorRect = getFixedBoudingClientRect(anchor);
    const badgeRect = getFixedBoudingClientRect(badge);

    const {
        top: anchorTop,
        left: anchorLeft,
        width: anchorWidth,
        height: anchorHeight,
    } = anchorRect;
    const { width: badgeWidth, height: badgeHeight } = badgeRect;

    badge.style.top = anchorTop + anchorHeight - badgeHeight / 2 + "px";
    badge.style.left = anchorLeft + anchorWidth / 2 - badgeWidth / 2 + "px";
}

function getGreatestCommonDivisor(a, b) {
    return b ? getGreatestCommonDivisor(b, a % b) : a;
}

function reduceRatio(numerator, denominator) {
    const greatestCommonDivisor = getGreatestCommonDivisor(
        numerator,
        denominator
    );

    return [
        numerator / greatestCommonDivisor,
        denominator / greatestCommonDivisor,
    ];
}

getElement(youtubeVideoContainerSelector, (videoContainer) => {
    const theaterContainer = document.querySelector(
        youtubeTheaterContainerSelector
    );
    const videoRect = getFixedBoudingClientRect(videoContainer);

    const { height: videoHeight } = videoRect;

    if (!isClosestParent(videoContainer, theaterContainer)) {
        throw new Error("Video container is not in theater mode.");
    }

    const badge = createResizeBadge();

    placeBadge(badge, videoContainer);

    theaterContainer.style.maxHeight = "none";
    theaterContainer.style.height = videoHeight + "px";

    badge.addEventListener("mousedown", (event) => {
        event.preventDefault();

        const videoRect = getFixedBoudingClientRect(videoContainer);
        const badgeRect = getFixedBoudingClientRect(badge);

        const { top: badgeTop, left: badgeLeft } = badgeRect;
        const { height: videoHeight } = videoRect;

        mousePosition = {
            x: event.pageX,
            y: event.pageY,
        };

        badgePosition = {
            x: badgeLeft,
            y: badgeTop,
        };

        savedVideoHeight = videoHeight;

        document.body.classList.add("yavh-disable-user-select");

        mouseIsPressed = true;
    });

    window.addEventListener("mouseup", (event) => {
        if (mouseIsPressed) {
            mousePosition = null;
            badgePosition = null;
            savedVideoHeight = null;

            document.body.classList.remove("yavh-disable-user-select");

            mouseIsPressed = false;
        }
    });

    window.addEventListener("mousemove", (event) => {
        if (mouseIsPressed) {
            const videoTag = document.querySelector(youtubeHTML5VideoSelector);
            const videoTagRect = getFixedBoudingClientRect(videoTag);

            const { width: videoTagWidth, height: videoTagHeight } =
                videoTagRect;

            const videoRatio = videoTagWidth / videoTagHeight;

            const dy = event.pageY - mousePosition.y;

            badge.style.top = badgePosition.y + dy + "px";
            theaterContainer.style.height = savedVideoHeight + dy + "px";
            videoTag.style.height = savedVideoHeight + dy + "px";
            videoTag.style.width = (savedVideoHeight + dy) * videoRatio + "px";
            videoTag.style.left =
                (window.innerWidth - (savedVideoHeight + dy) * videoRatio) / 2 +
                "px";
        }
    });
});
