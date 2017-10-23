//  DiscoZone.js
//
//  Script Type: Entity
//  Created by Jeff Moyes on 6/30/2017
//  Copyright 2017 High Fidelity, Inc.
//
//  This script works in conjunction with createDiscoFloor.js to a disco floor (a multitiled floor with each tile having a random color.
//  When an avatar steps on a tile, the tile should switch to a highlighted (lighter) version of its color
//  and then return to normal when the avatar steps off.
//  this script specifically creates a zone above the tiles, that checks for an avatar entering or leaving the zone
//  (defined according to the High Fidelity API as the aatar's torso entering ot leaving the zone), in which case it
// sends a message to the createDiscoFloor.js notifying it of the event



(function() {

    function DiscoZone() {
        return;
    }


    DiscoZone.prototype.enterEntity = function() {
        Messages.sendLocalMessage('zoneEntered', "true");
    };

    DiscoZone.prototype.leaveEntity = function(entityID) {
        Messages.sendLocalMessage('zoneLeft', "true");
    };

    DiscoZone.prototype.preload = function(entityID) {
        this.entityID = entityID;
    };


    DiscoZone.prototype.unload = function () {
        Entities.deleteEntity(this.entityID);
    };


    // entity scripts always need to return a newly constructed object of our type
    return new DiscoZone();
});
