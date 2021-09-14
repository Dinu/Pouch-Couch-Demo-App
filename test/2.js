const text = '<h1>Dynamic Hello All!</h1>'
const text2 = '<h1>Dynamic Hello 1!</h1>'
const text3 = '<h1>Dynamic Hello 2!</h1>'

const div = document.createElement('div')
const div2 = document.createElement('div')
const div3 = document.createElement('div')
const div4 = document.createElement('div')

div.innerHTML = text
div2.innerHTML = text2
div3.innerHTML = text3
div4.innerHTML = text3

document.body.appendChild(div)
document.body.appendChild(div2)
// document.body.appendChild(div3)
// document.body.appendChild(div4)


if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw2.js').then(function(registration) {
        
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
     
        console.log('ServiceWorker registration failed: ', err);
      });
    });
}
