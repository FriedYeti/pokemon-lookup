let pokewrap = {
	pokeAPI: {
		baseURL: 'https://pokeapi.co/api/v2/'
	},
	retrieve: async function(url) {
		const response = await fetch(url);
		if (response.status === 200) { return response.json(); }
		else {
			console.log(response);
			window.alert(response.statusText);
			return {};
		}
	},
	getPokemon: async function(pokemonName) {
		let pokemonData = await this.pullJSON('pokemon/' + pokemonName);
		return pokemonData;
	},
	getMove: async function(moveName) {
		let moveData = await this.pullJSON('move/' + moveName);
		return moveData;
	},
	pullJSON: async function(urlPostfix) {
		let newURL = this.pokeAPI.baseURL + urlPostfix;
		let jsonData = await this.retrieve(newURL);
		return jsonData;
	}
};
