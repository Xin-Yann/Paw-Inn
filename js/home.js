import Typebot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.3/dist/web.js'

Typebot.initBubble({
    typebot: "customer-support-92olq2c",
    theme: {
        button: { backgroundColor: "#0d9488" },
        chatWindow: { backgroundColor: "#fff" },
    },
});

AOS.init();
function displayModal(index) {
    var modalId = "modal" + (index + 1);
    document.getElementById(modalId).style.display = 'block';
}
var readMoreLinks = document.getElementsByClassName('readMoreLink');
var cards = document.getElementsByClassName('card');

for (var i = 0; i < readMoreLinks.length; i++) {
    readMoreLinks[i].addEventListener('click', function (event) {
        event.preventDefault(); 

        var index = Array.from(readMoreLinks).indexOf(this);
        displayModal(index);
    });
}

for (var i = 0; i < cards.length; i++) {
    cards[i].addEventListener('click', function (event) {
        event.preventDefault();
        var index = Array.from(cards).indexOf(this);
        displayModal(index);
    });
}

var closeBtns = document.querySelectorAll('.close');

for (var i = 0; i < closeBtns.length; i++) {
    closeBtns[i].addEventListener('click', function () {
        this.parentNode.parentNode.style.display = 'none';
    });
}

window.onclick = function (event) {
    var modals = document.getElementsByClassName('modal');
    for (var i = 0; i < modals.length; i++) {
        if (event.target == modals[i]) {
            modals[i].style.display = 'none';
        }
    }
}