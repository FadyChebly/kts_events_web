window.onload = function () {
	const eventOwnerSubmitBtn = document.querySelector('#submitEventOwner')
	let popup = document.querySelector('#popup1')
	let closebtn = document.querySelector('#close')


	eventOwnerSubmitBtn.addEventListener('click', (e) => {
		let emailField = document.querySelector('#eventOwnerEmail')
		if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailField.value)) {
			return (true)
		}
		else {
			e.preventDefault()
			popup.classList.remove('notVisible')
			popup.classList.add('visible')
			return (false)


		}

	})

	closebtn.addEventListener('click', () => {
		popup.classList.remove('visible')
		popup.classList.add('notVisible')
	})

	$('#myList a').on('click', function (e) {
		e.preventDefault()
		$(this).tab('show')
	})
	$('a[data-toggle="list"]').on('shown.bs.tab', function (e) {
		e.target // newly activated tab
		e.relatedTarget // previous active tab
	})

}