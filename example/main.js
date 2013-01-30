//global ig
ig.module(
	'game.main'
)
.requires(
	'impact.game',
	'impact.font',
	'plugins.layers'
)
.defines(function(){

MyGame = ig.Game.extend({

	font: new ig.Font('media/04b03.font.png'),

	init: function() {
		this.createLayer('gui', {
			noUpdate: true
		});

		this.addItem({
			_layer: 'gui',
			font: this.font,
			draw: function(){
				var x = ig.system.width/2,
					y = ig.system.height/2;

				this.font.draw('Hello World!, I am a layer!', x, y, ig.Font.ALIGN.CENTER);
			}
		});
	}

});


// Start the Game with 60fps,
// a resolution of 320x240,
// scaled up by a factor of 2
ig.main('#canvas', MyGame, 60, 320, 240, 2);

});
