/* global ig */
ig.module(
	'game.main'
)
.requires(
	'impact.game',
	'impact.font',
	'plugins.layers'
)
.defines(function(){

var MyGame = ig.Game.extend({

	font: new ig.Font('media/04b03.font.png'),

	init: function() {
		// This ensures you create the default background, foreground and entity layers
		// Although in this example they are never really used.
		this.parent();

		// Next we create a gui layer. It is automatically added to the .layerOrder array
		// as the top most layer to draw.
		this.createLayer('gui');

		// At this point, .layerOrder looks like this:
		// ['backgroundMaps', 'entities', 'foregroundMaps', 'gui']

		// Now that we have our `gui` layer in place, we need to add an item to it. Here I
		// hard coded a basic item with the necessary minimum requirements to properly display.
		this.addItem({
			// This is the layer it will get added too
			_layer: 'gui',

			// This is simply a reference to a font
			font: this.font,

			// I know this is a silly use of .update since it never changes,
			// but it's here for the sake of example.
			update: function(){
				this.x = ig.system.width  / 2;
				this.y = ig.system.height / 2;
			},

			// This is where the actual magic happens, we draw our font during the
			// gui layer's draw cycle
			draw: function(){
				this.font.draw(
					'Hello World!, I am a layer!',
					this.x,
					this.y,
					ig.Font.ALIGN.CENTER
				);
			}
		});
	}

});


// Start the Game with 60fps,
// a resolution of 320x240,
// scaled up by a factor of 2
ig.main('#canvas', MyGame, 60, 320, 240, 2);

});
