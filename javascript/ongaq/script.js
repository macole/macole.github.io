const ongaq = new Ongaq ({
	api_key: "fe4f3032983f4d18aec8d84ca10f8e4d",
	volume: 70,
	bpm: 120,
	onReady: ()=>{

		const button = document.getElementById("button")
		button.className = "button start"
		button.onclick = () => {
			if (ongaq.params.isPlaying) {
				ongaq.pause()
				button.className = "button start"
			} else {
				ongaq.start()
				button.className = "button pause"
			}
		}
	}
})

const my_drums = new Part ({
	sound: "small_cube_drums"
})
my_drums.add(new Filter ({
	key: "kick",
	active: beat => beat % 8 === 0
}))
ongaq.add(my_drums)

const my_guitar = new Part ({
	sound: "jazz_guitar",
	measure: 2
})

my_guitar.add(new Filter ({
	key: new Chord ( "CM9" ),
	length: 16,
	active: (beat, measure) => beat === 0 && measure === 0
}))
my_guitar.add(new Filter ({
	key: new Chord ( "C#m9" ),
	length: 4,
	active: (beat, measure) => beat === 4 && measure === 1
}))
ongaq.add(my_guitar)

const my_bass = new Part ({
	sound: "mono_bass",
	measure: 4
})

my_bass.add(new Filter ({
	key: (beat, measure) => {
		return measure !== 3 ? ["C2"] : ["C2#"]
	},
	length: 4,
	active: (beat, measure) => {
		return (beat ===
 12 && measure % 2 === 0) || (beat === 8 && measure % 2 === 1)
	}
}))
my_bass.add(new Filter ({
	type: "pan",
	x: (beat, measure) =>measure % 2 === 0 ? -45 : 45
}))

ongaq.add(my_bass)
