var currentDateTime = new Date();
var year = currentDateTime.getFullYear();
var month = (currentDateTime.getMonth() + 1);
var date = (currentDateTime.getDate() + 1);

if (date < 10) {
  date = '0' + date;
}
if (month < 10) {
  month = '0' + month;
}

var dateTomorrow = year + "-" + month + "-" + date;
var checkinElem = document.querySelector("checkin");
var checkoutElem = document.querySelector("checkout");

checkinElem.setAttribute("min", dateTomorrow);

checkinElem.onchange = function () {
  checkoutElem.setAttribute("min", this.value);
}

// Retrieve selected room name from sessionStorage
const selectedRoomName = sessionStorage.getItem('room_name');
if (selectedRoomName) {
    // Update the input field with the selected room name
    document.getElementById('room_name').value = selectedRoomName;
}
