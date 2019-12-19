var canvasEl = document.getElementById("canvas");
configure(canvasEl);
resize(800, 400);
noArrowScroll();
strokeCap(ROUND);

//var playerImage = loadImage("./alien.png", 64, 64);
//var playerImage2 = loadImage("./alien2.png", 64, 64);

var platforms = [],
  blocks = [];

var colliding = function(one, two) {
  return (Math.abs(one.pos.x - two.pos.x) < (one.width + two.width)/2 && Math.abs(one.pos.y - two.pos.y) < (one.height + two.height)/2);
}

var Entity = function(config) {
  this.pos = config.pos || new Vector2(config.px || 0, config.py || 0);
  this.vel = config.vel || new Vector2(config.vx || 0, config.vy || 0);
  this.width = config.baseWidth || config.width || 25;
  this.height = config.baseHeight || config.height || 25;
  this.prevPos = this.pos.get();
  this.speed = config.speed || 0.6;
  this.jumpVel = config.jumpVel || 8;
  this.control = config.control || (function() {
    return {
      moveUp: false,
      moveDown: false,
      moveLeft: false,
      moveRight: false,
      grabLeft: false,
      grabRight: false,
      jumpLeft: false,
      jumpRight: false,
    };
  });
};
Entity.prototype.collidePlatform = function(that) {
  if(this.vel.y >= 0) {
    if(Math.abs(this.pos.x - that.pos.x) < (this.width + that.width)/2) {
      if(this.pos.y >= that.pos.y - this.height/2 && this.prevPos.y <= that.pos.y - this.height/2) {
        this.vel.y = 0;
        this.pos.y = that.pos.y - this.height/2;
        this.restingDown = true;
      }
    }
  }
}
Entity.prototype.collideBlock = function(that) {
  if(colliding(this, that)) {
    //Top/bottom or left/right collision?
    if(Math.abs(this.prevPos.x - that.pos.x)/(this.width + that.width) > Math.abs(this.prevPos.y - that.pos.y)/(this.height + that.height)) {
      //Left Collision
      if(this.prevPos.x < that.pos.x) {
        if(this.vel.x > 0) {
          this.vel.x = 0;
        }
        this.pos.x = that.pos.x - this.width/2 - that.width/2;
        if(that.grab) {
          this.restingRight = true;
        }
      }
      //Right Collision
      else {
        if(this.vel.x < 0) {
          this.vel.x = 0;
        }
        this.pos.x = that.pos.x + this.width/2 + that.width/2;
        //grab to side
        if(that.grab) {
          this.restingLeft = true;
        }
      }
    }
    else {
      //Top Collision
      if(this.prevPos.y < that.pos.y) {
        if(this.vel.y > 0) {
          this.vel.y = 0;
        }
        this.pos.y = that.pos.y - this.height/2 - that.height/2;
        this.restingDown = true;
      }
      //Bottom Collision
      else {
        if(this.vel.y < 0) {
          this.vel.y = 0;
        }
        this.pos.y = that.pos.y + this.height/2 + that.height/2;
        this.restingTop = true;
      }
    }
  }
};
Entity.prototype.update = function() {
  let prevPos = this.pos.get();
  let control = this.control();

  if(control.moveLeft && !control.moveRight) {
    this.vel.x -= this.speed;
  }
  if(control.moveRight && !control.moveLeft) {
    this.vel.x += this.speed;
  }
  if(control.moveUp && this.restingDown) {
    this.vel.y = -this.jumpVel;
  }

  this.pos.add(this.vel);
  this.vel.x *= 0.8;
  if(!this.restingDown) {
    this.vel.y += 0.4;
  }
  this.restingDown = false;
  this.restingLeft = false;
  this.restingRight = false;

  for(var i = 0; i < platforms.length; i++) {
    if(!platforms[i].drop || !control.moveDown) {
      this.collidePlatform(platforms[i]);
    }
  }
  for(var i = 0; i < blocks.length; i++) {
    this.collideBlock(blocks[i]);
  }

  if(this.restingLeft) {
    if(control.grabLeft) {
      this.vel.y *= 0.7;
      if(control.moveUp) {
        this.vel.y = -this.jumpVel * 0.8;
        this.vel.x = this.jumpVel * 0.8;
      }
    }
    /*if(control.jumpRight) {
      this.vel.x = this.jumpVel;
    }*/
  }
  if(this.restingRight) {
    if(control.grabRight) {
      this.vel.y *= 0.7;
      if(control.moveUp) {
        this.vel.y = -this.jumpVel * 0.8;
        this.vel.x = -this.jumpVel * 0.8;
      }
    }
    /*if(control.jumpLeft) {
      this.vel.x = -this.jumpVel;
    }*/
  }


  this.prevPos = prevPos;
};

var Player = function(config) {
  config.control = function() {
    let result = {
      moveUp: false,
      moveDown: false,
      moveLeft: false,
      moveRight: false,
      grabLeft: false,
      grabRight: false,
      jumpLeft: false,
      jumpRight: false,
    };
    if(keys.arrowup) {
      result.moveUp = true;
    }
    if(keys.arrowdown) {
      result.moveDown = true;
    }
    if(keys.arrowleft) {
      result.moveLeft = true;
      result.grabLeft = true;
      result.jumpLeft = true;
    }
    if(keys.arrowright) {
      result.moveRight = true;
      result.grabRight = true;
      result.jumpRight = true;
    }
    return result;
  };
  Entity.call(this, config);
};
Player.prototype = Object.create(Entity.prototype);
Player.prototype.draw = function() {
  noStroke();
  fill(255, 0, 0);
  rect(this.pos.x - this.width/2, this.pos.y - this.height/2, this.width, this.height);
  //image((Math.floor(this.pos.x/6) % 2 === 1) ? playerImage : playerImage2, this.pos.x - this.width/2, this.pos.y - this.height/2, this.width, this.height);
};

var Platform = function(config) {
  this.pos = config.pos || new Vector2(config.px || 0, config.py || 0);
  this.width = config.width || 25;
  this.height = 0;
  this.drop = config.drop || true;
}
Platform.prototype.draw = function() {
  stroke(0);
  strokeWeight(2);
  line(this.pos.x - this.width/2, this.pos.y, this.pos.x + this.width/2, this.pos.y);
};

var Block = function(config) {
  this.pos = config.pos || new Vector2(config.px || 0, config.py || 0);
  this.width = config.width || 25;
  this.height = config.height || 25;
  this.grab = config.grab || true;
}
Block.prototype.draw = function() {
  noStroke();
  fill(50, 120, 230);
  rect(this.pos.x - this.width/2, this.pos.y - this.height/2, this.width, this.height);
};

/*platforms.push(new Platform({
  pos: new Vector2(400, 350),
  width: 100,
}));
platforms.push(new Platform({
  pos: new Vector2(300, 300),
  width: 50
}));
platforms.push(new Platform({
  pos: new Vector2(500, 300),
  width: 50
}));*/
blocks.push(new Block({
  pos: new Vector2(400, 100),
  width: 150,
  height: 30
}));

blocks.push(new Block({
  pos: new Vector2(400, 250),
  width: 50,
  height: 50
}));

blocks.push(new Block({
  pos: new Vector2(200, 175),
  width: 30,
  height: 150
}));
blocks.push(new Block({
  pos: new Vector2(600, 175),
  width: 30,
  height: 150
}));

blocks.push(new Block({
  pos: new Vector2(400, 350),
  width: 200,
  height: 10
}))

var player = new Player({
  pos: new Vector2(400, 200),
  width: 15
});

function draw() {
  background(255);
  player.update();
  player.draw();
  for(var i = 0; i < platforms.length; i++) {
    platforms[i].draw();
  }
  for(var i = 0; i < blocks.length; i++) {
    blocks[i].draw();
  }
};

loop(draw);
