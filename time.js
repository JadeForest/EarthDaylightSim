import { getTime } from "./setTime";

// Add current time to the div with id "clock"
function updateClock() {
    const now = getTime();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const clockTime = hours.toString().padStart(2, "0")
        + ":" + minutes.toString().padStart(2, "0")
        + ":" + seconds.toString().padStart(2, "0");
    document.getElementById("clock").innerHTML = clockTime;
    requestAnimationFrame(updateClock); // Update the clock every frame
}
updateClock(); // Update the clock initially

/* -------------------------------------------------------------------------- */

let lastDate;

function updateDate() {
    const now = getTime();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    const date = year + "-" + (month + 1).toString().padStart(2, "0") + "-" + day.toString().padStart(2, "0");

    if (lastDate !== date) {
        document.getElementById("date").innerHTML = date;
        lastDate = date;
    }
    requestAnimationFrame(updateDate); // Update the date every frame
}
updateDate(); // Update the date initially

/* -------------------------------------------------------------------------- */

function updateTimezone() {
    const now = getTime();
    const hrsOffset = now.getTimezoneOffset() / 60, minOffset = now.getTimezoneOffset() % 60;
    const timezone = "GMT" + (hrsOffset <= 0 ? "+" : "-") + Math.abs(hrsOffset).toString().padStart(2, "0") + minOffset.toString().padStart(2, "0");
    document.getElementById("timezone").innerHTML = timezone;
}
updateTimezone(); // Update the timezone initially