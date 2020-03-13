let db;

window.onload = function() {
	let searchButton = document.getElementById('search');
	searchButton.addEventListener('click',searchForInput);
	let loadFavoriteButton = document.getElementById('load-favorite');
	loadFavoriteButton.addEventListener('click', loadFavorite);
	let addNoteButton = document.getElementById('add-note');
	addNoteButton.addEventListener('click',addNote);
	let addFavButton = document.getElementById('add-fav');
	addFavButton.addEventListener('click',addFavorite);
	let removeFavButton = document.getElementById('rem-fav');
	removeFavButton.addEventListener('click',removeFavorite);

	
	//create and setup persistant database
	let request = window.indexedDB.open('poke_db', 1)
	request.onerror = function() {
		console.log(request);
		console.log('Unable to open database');
		alert('Unable to open database.\nFavorites and Notes will not work.')
	}
	request.onsuccess = function() {
		db = request.result;
		updateFavoritesList();
		displayNotes();
	}
	request.onupgradeneeded = function(e) {
		let db = e.target.result;
		let fav_os = db.createObjectStore('fav_os', {keyPath: 'id', autoIncrement: true});
		let note_os = db.createObjectStore('note_os', {keyPath: 'id', autoIncrement: true});
		fav_os.createIndex('name', 'name', {unique: false});
		note_os.createIndex('name', 'name', {unique: false});
		note_os.createIndex('note', 'note', {unique: false});
	}
}

async function searchForInput() {
	let searchResults = await pokewrap.getPokemon(document.getElementById('search-term').value);
	displayPokemonData(searchResults);
}

function displayPokemonData(pokemonData) {
	let pokeName = document.getElementById('pokemon-name');
	let pokeTypes = document.getElementById('pokemon-types');
	let pokeAbilities = document.getElementById('pokemon-abilities');
	
	pokeName.textContent = pokemonData.name;
	
	let typesString = pokemonData.types[0].type.name;
	if (pokemonData.types.length > 1) {
		typesString = 'Types: ' + typesString;
		typesString = typesString  + ' and ' + pokemonData.types[1].type.name;
	}
	else {
		typesString = 'Type: ' + typesString;
	}
	
	let abilitiesString = 'Abilities:';
	for(let i = 0; i < pokemonData.abilities.length; i++) {
		abilitiesString = abilitiesString  + '<br>' + pokemonData.abilities[i].ability.name;
	}

	pokeTypes.textContent = typesString;
	pokeAbilities.innerHTML = abilitiesString;
	//pokeSprite.src = pokemonData.sprites.front_default;
	
	setPokeSprites(pokemonData.sprites);
	displayNotes();
}

function clearPokeSprites() {
	//TODO store id's and src's in array
	document.getElementById('pokemon-sprite-front').src = '';
	document.getElementById('pokemon-sprite-back').src = '';
	document.getElementById('pokemon-sprite-front-female').src = '';
	document.getElementById('pokemon-sprite-back-female').src = '';
	document.getElementById('pokemon-sprite-front-shiny').src = '';
	document.getElementById('pokemon-sprite-back-shiny').src = '';
	document.getElementById('pokemon-sprite-front-female-shiny').src = '';
	document.getElementById('pokemon-sprite-back-female-shiny').src = '';
}

function setPokeSprites(spriteJSON) {
	clearPokeSprites();
	//TODO store id's and src's in array
	//show default if no female variant?
	if(spriteJSON.front_default !== null){
		document.getElementById('pokemon-sprite-front').src = spriteJSON.front_default;
	}
	if(spriteJSON.back_default !== null){
		document.getElementById('pokemon-sprite-back').src = spriteJSON.back_default;
	}
	if(spriteJSON.front_female !== null){
		document.getElementById('pokemon-sprite-front-female').src = spriteJSON.front_female;
	}
	if(spriteJSON.back_female !== null){
		document.getElementById('pokemon-sprite-back-female').src = spriteJSON.back_female;
	}
	if(spriteJSON.front_shiny !== null){
		document.getElementById('pokemon-sprite-front-shiny').src = spriteJSON.front_shiny;
	}
	if(spriteJSON.back_shiny !== null){
		document.getElementById('pokemon-sprite-back-shiny').src = spriteJSON.back_shiny;
	}
	if(spriteJSON.front_shiny_female !== null){
		document.getElementById('pokemon-sprite-front-female-shiny').src = spriteJSON.front_shiny_female;
	}
	if(spriteJSON.back_shiny_female !== null){
		document.getElementById('pokemon-sprite-back-female-shiny').src = spriteJSON.back_shiny_female;
	}
}

async function addFavorite() {
	let favInput = document.getElementById('pokemon-name').textContent;
	if(await isOnFavorites(favInput)) {
		alert('You already have that pokemon favorited.');
	} else if(favInput !== '') {
		let newFav = {name: favInput};
		let transaction = db.transaction(['fav_os'], 'readwrite');
		let objectStore = transaction.objectStore('fav_os');
		let request = objectStore.add(newFav);
		transaction.oncomplete = function() {
			updateFavoritesList();
		}
	}
}

async function removeFavorite() {
	let currentPokemon = document.getElementById('pokemon-name').textContent;
	if(await isOnFavorites(currentPokemon)) {
		let targetNode = document.getElementById('favorite'+currentPokemon);
		if(targetNode !== null) {
			let favID = Number(targetNode.getAttribute('data-fav-id'));
			let transaction = db.transaction(['fav_os'], 'readwrite');
			let objectStore = transaction.objectStore('fav_os');
			let request = objectStore.delete(favID);

			targetNode.parentNode.removeChild(targetNode);
		}
	} else {
		alert('That pokemon has not been favorited yet.');
	}
}

async function loadFavorite() {
	let fav = document.getElementById('favorites').value;
	if(fav !== '') {
		let searchResults = await pokewrap.getPokemon(fav);
		displayPokemonData(searchResults);
	}
}

function updateFavoritesList() {
	let selectParent = document.getElementById('favorites');
	while (selectParent.firstChild) {
		selectParent.removeChild(selectParent.firstChild);
	}
	let objectStore = db.transaction('fav_os').objectStore('fav_os');
	objectStore.openCursor().onsuccess = function(e) {
		let cursor = e.target.result;

		if(cursor) {
			let newFavorite = document.createElement('option');
			newFavorite.setAttribute('id', 'favorite' + cursor.value.name);
			newFavorite.setAttribute('data-fav-id', cursor.value.id);
			newFavorite.value = cursor.value.name;
			newFavorite.text = cursor.value.name;
			selectParent.appendChild(newFavorite);

			cursor.continue();
		}
	}
}

function isOnFavorites(pokeName) {
	return new Promise(function(resolve,reject) {
		let result = false;
		let transaction = db.transaction(['fav_os']);
		let objectStore = transaction.objectStore('fav_os');
		objectStore.openCursor().onsuccess = function(e) {
			let cursor = e.target.result;
	
			if(cursor) {
				if(cursor.value.name === pokeName) {
					result = true;
				}
				cursor.continue();
			}
		}
		transaction.oncomplete = function() {
			resolve(result);
		}
	});
}

function addNote() {
	//add data to the note_os in db
	let noteInput = document.getElementById('note-input');
	let noteLoc = document.getElementById('pokemon-name');
	let newNote = {name: noteLoc.textContent,  note: noteInput.value};
	let transaction = db.transaction(['note_os'], 'readwrite');
	let objectStore = transaction.objectStore('note_os');
	let request = objectStore.add(newNote);
	request.onsuccess = function() {
		noteInput.value = '';
	}
	transaction.oncomplete = function() {
		displayNotes();
	}

}

function displayNotes() {
	//clear existing notes
	let listParent = document.getElementById('notes');
	while (listParent.firstChild) {
		listParent.removeChild(listParent.firstChild);
	}

	let objectStore = db.transaction('note_os').objectStore('note_os');
	objectStore.openCursor().onsuccess = function(e) {
		let cursor = e.target.result;

		if(cursor) {
			if(cursor.value.name === document.getElementById('pokemon-name').textContent) {
				let para = document.createElement('p');
				para.textContent = cursor.value.note;
				para.setAttribute('data-note-id', cursor.value.id);
				para.setAttribute('class', 'displayed-note');
				listParent.appendChild(para);

				const deleteBtn = document.createElement('button');
				deleteBtn.textContent = 'Delete Note';
				deleteBtn.setAttribute('class', 'note-deleter');
				para.appendChild(deleteBtn);
				deleteBtn.onclick = deleteNote;
			}
			cursor.continue();
		}
	}
}

function deleteNote(e) {
	let noteID = Number(e.target.parentNode.getAttribute('data-note-id'));
	let transaction = db.transaction(['note_os'], 'readwrite');
	let objectStore = transaction.objectStore('note_os');
	let request = objectStore.delete(noteID);

	e.target.parentNode.parentNode.removeChild(e.target.parentNode);
}

