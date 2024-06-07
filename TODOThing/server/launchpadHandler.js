/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */

const Launchpad = require( 'launchpad-mini' );

const sortByX = ( a, b ) => {
    if ( a[ 0 ] < b[ 0 ] ) return -1;
    if ( a[ 0 ] > b[ 0 ] ) return 1;
    return a[ 1 ] - b[ 1 ];
};

const tReset = 2000;

//const pad = new Launchpad();
//pad.connect().then( () => {
//    pad.reset();
//    console.log( `Hold any button for more than ${tReset / 1000} s to reset the pad.` );
//
//    let keys = new Map();
//    let lastKeydown = 0;
//
//    pad.on( 'key', ( k ) => {
//        if ( k.pressed ) {
//
//            lastKeydown = Date.now();
//
//            if ( keys.has( k.id ) ) {
//                keys.delete( k.id );
//                pad.col( Launchpad.Colors.off, k );
//            } else {
//                keys.set( k.id, k );
//                pad.col( Launchpad.Colors.green, k );
//            }
//
//            const sortedKeys = Array.from( keys.values() )
//                .map( el => ([ el.x, el.y ]) )
//                .sort( sortByX );
//            console.log( JSON.stringify( sortedKeys ) );
//
//        } else {
//            if ( Date.now() - lastKeydown > tReset ) {
//                keys.clear();
//                pad.reset();
//            }
//        }
//    } );
//
//} );