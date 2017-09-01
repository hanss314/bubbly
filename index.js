const bubble_types = [
    "red",
    "green",
    "equation"
];
const DIAMETER = 12;

var bubbles = [];
var last_spawn = 0;
var spawn_every = 500;
var bubble_time = 5000;
var score = 0;
var alive = true;
var faded = false;

(function tick() {
    window.requestAnimationFrame(tick);

    $("#score").text(score);

    if (alive) {
        var i, j, position, velocity, position2, velocity2;
        // Physics

        // Move 'em
        for (i = 0; i < bubbles.length; i += 1) {
            position = bubbles[i].body.position;
            velocity = bubbles[i].body.velocity;

            position.x += velocity.x;

            if (position.x > 100 - DIAMETER / 2 || position.x < DIAMETER / 2) {
                position.x -= velocity.x;
                velocity.x = -velocity.x;
            }

            position.y += velocity.y;

            if (position.y > 100 - DIAMETER / 2 || position.y < DIAMETER / 2) {
                position.y -= velocity.y;
                velocity.y = -velocity.y;
            }
        }

        // Collide 'em
        for (i = 0; i < bubbles.length; i += 1) {
            position = bubbles[i].body.position;
            velocity = bubbles[i].body.velocity;

            for (j = 0; j < bubbles.length; j += 1) {
                position2 = bubbles[j].body.position;
                velocity2 = bubbles[j].body.velocity;

                if (position != position2) {
                    if (position.x + position.radius + position2.radius > position2.x
                        && position.x < position2.x + position.radius + position2.radius
                        && position.y + position.radius + position2.radius > position2.y
                        && position.y < position2.y + position.radius + position2.radius) {

                        var dist = Math.sqrt(((position.x - position2.x) * (position.x - position2.x))
                            + ((position.y - position2.y) * (position.y - position2.y)));
                        if (dist < position.radius + position2.radius) {
                            // Collision.
                            var newVelX1 = (velocity.x * (position.mass - position2.mass) + (2 * position2.mass * velocity2.x)) / (position.mass + position2.mass);
                            var newVelY1 = (velocity.y * (position.mass - position2.mass) + (2 * position2.mass * velocity2.y)) / (position.mass + position2.mass);
                            var newVelX2 = (velocity2.x * (position2.mass - position.mass) + (2 * position.mass * velocity.x)) / (position.mass + position2.mass);
                            var newVelY2 = (velocity.y * (position2.mass - position.mass) + (2 * position.mass * velocity.y)) / (position.mass + position2.mass);

                            velocity.x = newVelX1;
                            velocity.y = newVelY1;
                            velocity2.x = newVelX2;
                            velocity2.y = newVelY2;

                            position.x += newVelX1;
                            position.y += newVelY1;
                            position2.x += newVelX2;
                            position2.y += newVelY2;
                        }
                    }
                }
            }
        }

        // Render
        var kill = [];
        for (i = 0; i < bubbles.length; i += 1) {
            position = bubbles[i].body.position;

            bubbles[i].dom.parent.css(
                {
                    top: (position.y - DIAMETER / 2) + "%",
                    left: (position.x - DIAMETER / 2) + "%"
                }
            );

            var size = (performance.now() - bubbles[i].state.time_start) / bubbles[i].state.time_length;
            bubbles[i].dom.inner.css(
                {
                    width: size * 100 + "%",
                    height: size * 100 + "%"
                }
            );
            if (size > 0.8) {
                bubbles[i].dom.parent.css(
                    {
                        opacity: 1 - ((size - 0.8) * 5)
                    }
                );
            }

            if (size > 1) {
                kill.push(bubbles[i]);
            }
        }

        for (i = 0; i < kill.length; i += 1) {
            kill[i].dom.parent.remove();
            bubbles.splice(bubbles.indexOf(kill[i]), 1);

            if (kill[i].state.type == "green" || kill[i].state.correct === true) {
                trigger_death(kill[i]);
            }
        }

        // Spawn more
        if (performance.now() - last_spawn > spawn_every) {
            create_bubble();
            last_spawn = performance.now();
        }
    } else if (!faded) {
        // Fade out.
        faded = true;

        for (i = 0; i < bubbles.length; i += 1) {
            bubbles[i].dom.parent.animate(
                {
                    opacity: 0
                }, 1000
            );
        }
    }
})();

function create_bubble() {
    if (!alive) {
        return
    }
    var new_type = Math.floor(Math.random() * bubble_types.length);
    new_type = bubble_types[new_type];
    var new_id = Date.now();

    var collision = true;
    var collides = 0;
    while (collision && collides < 10) {
        var new_x = Math.floor(Math.random() * (101 - DIAMETER));
        var new_y = Math.floor(Math.random() * (101 - DIAMETER));
        var new_radius = DIAMETER;

        collision = false;

        for (var i = 0; i < bubbles.length; i += 1) {
            var position = bubbles[i].body.position;

            if (position.x + position.radius + new_radius > new_x
                && position.x < new_x + position.radius + new_radius
                && position.y + position.radius + new_radius > new_y
                && position.y < new_y + position.radius + new_radius) {

                collision = true;
                collides += 1;
            }
        }
    }

    if (collides < 9) {
        var equation = "";
        var eq_correct = false;
        var to_append = "";
        if (new_type === 'equation'){
            var operators = ['+','-','*'];
            equation = Math.ceil(Math.random()).toString() +
                operators[Math.floor(Math.random() * operators.length)] +
                Math.ceil(Math.random()*10).toString();
            var answer = eval(equation);
            if (Math.random() > 0.5){
                equation += '<br>=' + answer.toString();
                eq_correct = true
            }else{
                var fake_ans = Math.floor(Math.random()*10);
                if (fake_ans === answer) {fake_ans++;}
                equation += '<br>=' + fake_ans.toString();
                eq_correct = false
            }
            to_append =
                "<div id=\"" + new_id + "\" class=\"bubble " + new_type + "\"><div class=\"inner\"></div>"+
                "<div class=\"center\">"+equation+"</div></div>"
        }else{
            to_append = "<div id=\"" + new_id + "\" class=\"bubble " + new_type + "\"><div class=\"inner\"></div></div>"
        }


        $("#game_area").append(to_append);

        var new_elm = $("#" + new_id);
        var inner_elm = $("#" + new_id + ">.inner");
        new_elm.css(
            {
                top: new_y + "%",
                left: new_x + "%"
            }
        );

        var body = {
            'position': {
                'x': new_x + DIAMETER / 2,
                'y': new_y + DIAMETER / 2,
                'radius': new_radius / 2,
                'mass': 1
            },
            'velocity': {
                'x': (Math.random() - 0.5) / 10,
                'y': (Math.random() - 0.5) / 10
            }
        };
        var new_bubble = {
            'body': body, 
            'state': {
                'time_start': performance.now(),
                'time_length': bubble_time,
                'type': new_type,
                'correct': eq_correct
            },
            'dom': {'parent': new_elm, 'inner': inner_elm}
        };
        bubbles.push(new_bubble);
    }
}

$(document).on("toutchstart mousedown", function (e) {
    // offsetX, offsetY
    var rel_x, rel_y, ga;
    ga = $("#game_area");
    rel_x = ((e.clientX - ga.position().left) / ga.width()) * 100;
    rel_y = ((e.clientY - ga.position().top) / ga.height()) * 100;

    var kill = [];
    for (var i = 0; i < bubbles.length; i += 1) {
        var position = bubbles[i].body.position;

        if (position.x + position.radius > rel_x
            && position.x < rel_x + position.radius
            && position.y + position.radius > rel_y
            && position.y < rel_y + position.radius) {

            var dist = Math.sqrt(((position.x - rel_x) * (position.x - rel_x))
                + ((position.y - rel_y) * (position.y - rel_y)));
            if (dist < position.radius) {
                // Collision.
                kill.push(bubbles[i]);
            }
        }
    }

    for (i = 0; i < kill.length; i ++) {
        kill[i].dom.parent.remove();
        bubbles.splice(bubbles.indexOf(kill[i]), 1);

        if (kill[i].state.type == "green") {
            score++;
        } else if (kill[i].state.type == "red") {
            trigger_death(kill[i]);
        } else if (kill[i].state.type == "equation") {
            if(kill[i].state.correct){
                score++;
            }else{
                trigger_death(kill[i]);
            }
        }
    }
});

function trigger_death(bubble) {
    var dom_death = $("#death");
    var dom_restart = $("#restart-fade");
    alive = false;
    dom_death.css(
        {
            width: 0,
            height: 0,
            opacity: 0,
            top: bubble.body.position.y + "%",
            left: bubble.body.position.x + "%"
        }
    );
    dom_restart.css(
        {
            width: 0,
            height: 0,
            opacity: 0,
            top: bubble.body.position.y + "%",
            left: bubble.body.position.x + "%"
        }
    );
    dom_death.animate(
        {
            width: '250vmin',
            height: '250vmin',
            opacity: 1
        }, 1500, 'swing', function () {
            dom_restart.animate(
                {
                    width: '250vmin',
                    height: '250vmin',
                    opacity: 1
                }, 1000, 'swing', function () {
                    dom_restart.fadeOut();
                    dom_death.hide();
                    score = 0;
                    alive = true;

                    for (var i = 0; i < bubbles.length; i += 1) {
                        bubbles[i].dom.parent.remove();
                    }
                    bubbles = [];
                }
            );
            dom_restart.show();
        }
    );
    dom_death.show();
}

$().ready(function () {
    console.log("BubblyPop.io v0.0.1");
});
