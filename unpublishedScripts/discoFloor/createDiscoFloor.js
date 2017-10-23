//  createDiscoFloor.js
//
//  Script Type: Entity Spawner
//  Created by Jeff Moyes on 6/30/2017
//  Copyright 2017 High Fidelity, Inc.
//
//  This script creates a disco floor (a multitiled floor with each tile having a random color.
//  When an avatar steps on a tile, the tile should switch to a highlighted (lighter) version of its color
//  and then return to normal when the avatar steps off
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

// Settings
var numColumns = 100;
var numRows = 100;
var tileDimensionX = 2;
var tileDimensionY = 2;
var tileDimensionZ = 2;
var positionY = 0;

// The colors are in the following order: red, green ,blue, purple, coral(orange), yellow, maroon
var colorPallet = [
    { "base":{ "red": 200, "green": 0, "blue": 0 }, "highlight":{ "red": 255, "green": 0, "blue": 0 }},
    { "base":{ "red": 0, "green": 200, "blue": 0 }, "highlight":{ "red": 0, "green": 255, "blue": 0 }},
    { "base":{ "red": 0, "green": 0, "blue": 200 }, "highlight":{ "red": 255, "green": 0, "blue": 255 }},
    { "base":{ "red": 128, "green": 0, "blue": 128 }, "highlight":{ "red": 186, "green": 85, "blue": 211 }},
    { "base":{ "red": 255, "green": 127, "blue": 80 }, "highlight":{ "red": 255, "green": 165, "blue": 0 }},
    { "base":{ "red": 255, "green": 255, "blue": 0 }, "highlight":{ "red": 255, "green": 255, "blue": 200 }},
    { "base":{ "red": 128, "green": 0, "blue": 0 }, "highlight":{ "red": 178, "green": 34, "blue": 34 }},
];
// End Settings


// Don't change things below here unless you are reprogramming things
var colOffset = -(Math.floor( numColumns / 2 ));
var rowOffset = -(Math.floor( numRows / 2 ));
var tileOffsetX = ( numColumns % 2 == 0 ) ? tileDimensionX/2 : 0;
var tileOffsetZ = ( numRows % 2 == 0 ) ? tileDimensionZ/2 : 0;
//print("\ncolOffset = " + colOffset + ", numColumns = " + numColumns + "\nrowOffset = " + rowOffset + ", numRows = " + numRows + "\n( numColumns % 2 == 0 ): " + ( numColumns % 2 == 0 ) + " -- tileOffsetX = " + tileOffsetX + ", tileOffsetZ = " + tileOffsetZ);

var floorTiles = [];
var currentTile = undefined;
var discoFloorSensorZone;
var scriptURL_discoZone = Script.resolvePath('discoZone.js');
var updateConnected = false;






function makeTiles() {
    var rowNum, colNum, rowArray, randomColorIndex, boxEntity;

    for (rowNum = 0; rowNum < numRows; rowNum++) {
        rowArray = [];
        for (colNum = 0; colNum < numColumns; colNum++) {
            randomColorIndex = Math.floor( Math.random() * colorPallet.length )
            boxEntity = this.makeTile( rowNum, colNum, randomColorIndex );
          //  rowArray.push({"tile":boxEntity, "r": randomColorIndex, "rowNum": rowNum, "colNum": colNum});
		    rowArray.push({"tile":boxEntity, "r": randomColorIndex});
        }
        floorTiles.push(rowArray);
    }
}



function makeTile( rowNum, colNum, randomColorIndex) {
    var positionX, positionZ, tileProps;

    positionX = (colNum + colOffset) * tileDimensionX  + tileOffsetX;
    positionZ = (rowNum + rowOffset) * tileDimensionZ  + tileOffsetZ;

    tileProps = {
       type: 'Box',
       name: 'DiscoFloor_' + rowNum + '_' + colNum,
       color:  colorPallet[randomColorIndex].base,
       position: { "x": positionX, "y":  positionY, "z": positionZ },
       grabbable: false,
       dimensions: {
           "x": tileDimensionX,
           "y": tileDimensionY,
           "z": tileDimensionZ
       },
       userData: JSON.stringify({"colorIndex": randomColorIndex})
    }

    return Entities.addEntity(tileProps);
}




function makeZone(){
    // Because the registration point is in the middle of a zone just give the zone the dimensions
    // and place it at 0 and it will automatically be centered correctly
    var zoneProps = {
       type: 'Zone',
       name: 'DiscoFloorSensorZone',
       script: scriptURL_discoZone,
       position: {
           "x": 0,
           "y": positionY + tileDimensionY,
           "z": 0,
       },
       dimensions: {
           "x": numColumns * tileDimensionX,
           "y": positionY + tileDimensionY + 4,
           "z": numRows * tileDimensionZ
       },
    }
    discoFloorSensorZone = Entities.addEntity(zoneProps);
}




function handleMessages(channel, message, sender) {
    if (sender === MyAvatar.sessionUUID) {
        if (channel === 'zoneEntered' && !updateConnected) {
            updateConnected = true;
            Script.update.connect(update);
        }
        if (channel === 'zoneLeft' && updateConnected) {
            if ( currentTile  ) {
                unsetCurrentTile();
            }
            updateConnected = false;
            Script.update.disconnect(update);
        }
    }
}




function update() {
    var rowNum, colNum, x, z;
    var footPosition = MyAvatar.getJointPosition("LeftFoot");

    x = Math.floor(footPosition.x);
    z = Math.floor(footPosition.z);
    colNum = Math.ceil((x - tileDimensionX/2) / tileDimensionX) - colOffset;
    rowNum = Math.ceil((z - tileDimensionZ/2) / tileDimensionZ) - rowOffset;

    if ( !currentTile ) {
        setCurrentTile( rowNum, colNum );
        } else {
        if ( rowNum != currentTile.rowNum || colNum != currentTile.colNum ) {
            unsetCurrentTile();
            setCurrentTile( rowNum, colNum );
        } else {
            /* it's the same */
        }
    }
}




function setCurrentTile(rowNum, colNum) {

    if ( typeof floorTiles[rowNum] === undefined  || typeof floorTiles[rowNum][colNum] === undefined ) {
        // tile doesn't exist - so returning
        return;
    }
    currentTile = floorTiles[rowNum][colNum];
    setTileColor('highlight');
}




function unsetCurrentTile() {
    setTileColor('base');
    currentTile = undefined;
}




function setTileColor(state) {
    var randomColorIndex = currentTile.r;
    var newColor = (state == 'base' ) ? colorPallet[randomColorIndex].base : colorPallet[randomColorIndex].highlight;
    Entities.editEntity( currentTile.tile, { color: newColor });
}




function init() {
    var footPosition, zoneXMin, zoneXMax, zoneYMin, zoneYMax, zoneZMin, zoneZMax;

    Script.scriptEnding.connect( cleanUp );
    Messages.messageReceived.connect(handleMessages);

    makeTiles();
    makeZone();

    footPosition = MyAvatar.getJointPosition("LeftFoot");
    x = Math.floor(footPosition.x);
    z = Math.floor(footPosition.z);

    zoneXMin = 0 - (numColumns * tileDimensionX) / 2;
    zoneXMax = 0 + (numColumns * tileDimensionX) / 2;
    zoneYMin = positionY;
    zoneYMax = positionY + tileDimensionY;
    zoneZMin = 0 - (numRows * tileDimensionZ) / 2;
    zoneZMax = 0 + (numRows * tileDimensionZ) / 2;

    if ( zoneXMin < footPosition.x && footPosition.x < zoneXMax && zoneYMin < footPosition.y && footPosition.y < zoneYMax && zoneZMin < footPosition.z && footPosition.z < zoneZMax) {
        print("YOU ARE IN THE ZONE");
        updateConnected = true;
        Script.update.connect(update);
    }
}




function cleanUp() {
    for (var rowNum = 0; rowNum < numRows; rowNum++) {
        for (var colNum = 0; colNum < numColumns; colNum++) {
            Entities.deleteEntity(floorTiles[rowNum][colNum].tile);
        }
    }
     floorTiles = [];

    Entities.deleteEntity(discoFloorSensorZone);
}





init();