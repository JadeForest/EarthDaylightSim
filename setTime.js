let offset = 0;

function getTime() {
    if (offset === 0) {
        return new Date();
    }
    return new Date(Date.now() + offset);
}

function handleInputTime() {
    const inputTime = document.getElementById("datetime-input").value;
    if (inputTime === '') return;
    const now = new Date();
    const inputDate = new Date(inputTime);
    offset = inputDate.getTime() - now.getTime();
}

document.getElementById("set-time-btn").addEventListener("click", handleInputTime);

function handleSetNow() {
    offset = 0;
    document.getElementById("datetime-input").value = '';
}

document.getElementById("set-now-btn").addEventListener("click", handleSetNow);

export { getTime };