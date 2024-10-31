/*
 * This post-build script will copy the output to packages/client/build, 
 * a directory which is wiped before every client build, so build order
 * is very important.
 */

const fs = require( 'fs' );
const path = require( 'path' );

if ( !process.cwd().includes( path.join( 'packages', 'vercel' ) ) ) {
    console.error( "This script should be run from packages/vercel. Exiting as run in", process.cwd() );
    process.exit( 1 );
}

const sourceDir = path.join( __dirname, 'build' );
const targetDir = path.join( __dirname, '..', '..', 'api' );

if ( !fs.existsSync( targetDir ) ) {
    fs.mkdirSync( targetDir, { recursive: true } );
}

fs.readdirSync( sourceDir ).forEach( file => {
    const srcFile = path.join( sourceDir, file );
    const destFile = path.join( targetDir, file );

    fs.copyFileSync( srcFile, destFile );
    console.log( `Copied ${ file } to ${ targetDir }` );
} );
