const socket = io();
//elements
const messageForm = document.querySelector("#message-form");
const messageFormInput = document.querySelector("#message-input");
const messageFormButton = document.querySelector("button");
const sendLocationButton = document.querySelector("#get-location");
const messages = document.querySelector("#messages");
// templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  //New message element
  const newMessage = messages.lastElementChild;

  //Height of the new message
  const newMessageStyels = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyels.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // Visible Height
  const visibleHeight = messages.offsetHeight;

  //Height of messages container
  const containerHeight = messages.scrollHeight;

  //How far have I scrolled
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("message", (msg) => {
  const html = Mustache.render(messageTemplate, {
    username: msg.username,
    message: msg.text,
    createdAt: moment(msg.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (message) => {
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  document.querySelector("#sidebar").innerHTML = html;
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  messageFormButton.setAttribute("disabled", "disabled");
  const msg = messageFormInput.value;
  socket.emit("sendMessage", msg, (error) => {
    messageFormButton.removeAttribute("disabled");
    messageFormInput.value = "";
    messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log("message delivered");
  });
});

sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }
  sendLocationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    console.log(position);
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        sendLocationButton.removeAttribute("disabled");
        console.log("location shared");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
