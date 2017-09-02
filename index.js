const bubble_types = [
    "red",
    "green",
    "equation",
    "triple"//,
    //"split" // TODO: Work out how to spawn bubbles in vicinity but not overlapping.
];
const DIAMETER = 12;

var bubbles = [];
var last_spawn = 0;
var spawn_every = 500;
var bubble_time = 5000;
var score = 0;
var alive = false;
var faded = false;
var death = true;  // Debug. Alter this in the console before playing.

var name = "";

var osu = false;
var osu_file = "";
var osu_hitpoints = [];
var osu_timestamp = 0;
var osu_last_timestamp = 0;

(function tick() {
    window.requestAnimationFrame(tick);

    $("#score").text(score);

    if (!osu) {
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
    } else if (alive) {
        for (i = 0; i < osu_hitpoints.length; i++) {
            var hp = osu_hitpoints[i];
            if (hp[2] > osu_last_timestamp && hp[2] <= osu_timestamp) {
                console.log(hp);

                var new_id = Date.now();
                var new_type = "green";

                var to_append = "<div id=\"" + new_id + "\" class=\"bubble " + new_type + "\"><div class=\"inner\"></div></div>"

                $("#game_area").append(to_append);


                var new_elm = $("#" + new_id);
                var inner_elm = $("#" + new_id + ">.inner");
                new_elm.css(
                    {
                        top: hp[1] + "%",
                        left: hp[0] + "%"
                    }
                );

                var body = {
                    'position': {
                        'x': hp[0],
                        'y': hp[1],
                        'radius': DIAMETER / 2,
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
                        'correct': false
                    },
                    'dom': {'parent': new_elm, 'inner': inner_elm}
                };
                bubbles.push(new_bubble);
            }
        }
        osu_last_timestamp = osu_timestamp;
        osu_timestamp += 16;
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
            if (alive && !osu) {trigger_death(kill[i])};
        }
    }

    // Spawn more
    if (performance.now() - last_spawn > spawn_every) {
        if (!osu) {
            create_bubble();
            last_spawn = performance.now();
        }
    }

    if (!(faded || alive)) {
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

    if (!osu) {
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
            if (new_type === 'equation') {
                var operators = ['+', '-', '*'];
                equation = Math.ceil(Math.random()).toString() +
                    operators[Math.floor(Math.random() * operators.length)] +
                    Math.ceil(Math.random() * 10).toString();
                var answer = eval(equation);
                if (Math.random() > 0.5) {
                    equation += '<br>=' + answer.toString();
                    eq_correct = true
                } else {
                    var fake_ans = Math.floor(Math.random() * 10);
                    if (fake_ans === answer) {
                        fake_ans++;
                    }
                    equation += '<br>=' + fake_ans.toString();
                    eq_correct = false
                }
                to_append =
                    "<div id=\"" + new_id + "\" class=\"bubble " + new_type + "\"><div class=\"inner\"></div>" +
                    "<div class=\"center\">" + equation + "</div></div>"
            } else if (new_type === "triple") {
                to_append = "<div id=\"" + new_id + "\" class=\"bubble " + new_type + "\"><div class=\"ring ring1\"></div><div class=\"ring ring2\"></div><div class=\"ring ring3\"></div><div class=\"inner\"></div></div>"
            } else if (new_type == "split") {
                to_append = "<div id=\"" + new_id + "\" class=\"bubble " + new_type + "\"><div class=\"inner\"></div><div class=\"smol-ball sb1\"></div><div class=\"smol-ball sb2\"></div><div class=\"smol-ball sb3\"></div></div>"
            } else {
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
                    'correct': eq_correct,
                    'rings': 3
                },
                'dom': {'parent': new_elm, 'inner': inner_elm}
            };
            bubbles.push(new_bubble);
        }
    }
}

function trigger_death(bubble) {
    if (!death) {
        bubble.dom.parent.remove();
        return;
    }

    var dom_death = $("#death");
    var dom_restart = $("#restart-fade");
    alive = false;
    bubble.dom.parent.css('z-index', 3);
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
            bubble.dom.parent.fadeOut(400);
            dom_restart.animate(
                {
                    width: '250vmin',
                    height: '250vmin',
                    opacity: 1
                }, 1000, 'swing', function () {
                    dom_restart.fadeOut(400);
                    dom_death.hide();
                    score = 0;
                    alive = true;

                    for (var i = 0; i < bubbles.length; i += 1) {
                        bubbles[i].dom.parent.remove();
                    }
                    bubble.dom.parent.remove();
                    bubbles = [];
                }
            );
            dom_restart.show();
        }
    );
    dom_death.show();
}

function readSingleFile(e) {
    var file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        return contents;
    };
    reader.readAsText(file);
}

function load_osu() {
    var loader = $("#file-loader");

    loader.trigger('click');

    loader.on("change", function(event) {
        var file = loader[0].files[0];
        var reader  = new FileReader();

        reader.readAsText(file);

        reader.addEventListener("load", function () {
            console.log(reader.result);
            osu = true;
            osu_file = reader.result;
            var osu_lines = osu_file.split('\n');
            osu_hitpoints = [];
            var hp = false;
            for (var i = 0; i < osu_lines.length; i++) {
                var line = osu_lines[i];
                if (line.startsWith("[HitObjects]")) {
                    hp = true;
                } else if (line[0] == "[") {
                    hp = false;
                } else if (hp) {
                    // In [HitObjects]
                    var parts = line.split(',');
                    if (parts.length != 7) {
                        var x, y, time, points;
                        if (parts.length > 6) {
                            // Slider
                            x = parts[0];
                            y = parts[1];
                            time = parts[2];
                            points = parts[3].split("|").slice(1);
                            x = (x / 512) * 100;
                            y = (y / 385) * 100;
                            osu_hitpoints.push([x, y, time]);

                            for (var j = 0; j < points.length; j ++) {
                                var s = points[j].split(":");
                                x = s[0];
                                y = s[1];

                                x = (x / 512) * 100;
                                y = (y / 385) * 100;
                                osu_hitpoints.push([x, y, time]);
                            }
                        } else {
                            // Hit circle
                            x = parts[0];
                            y = parts[1];
                            time = parts[2];
                            x = (x / 512) * 100;
                            y = (y / 385) * 100;
                            osu_hitpoints.push([x, y, time]);
                        }
                    }
                }
            }
        });
    });
}

$().ready(function () {
    console.log("BubblyPop.io v0.0.1");
    console.debug("Generating keyboard.");
    var keyboard = $("#keyboard");
    var keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ←↵";
    var x = 0, y = 0;

    for (var i = 0; i < keys.length; i++) {
        $("#keybar").append("<div class=\"kbkey\">" + keys[i] + "</div>");

        var element = "<div class=\"key\" id=\"key-" + keys[i] + "\">" + keys[i] + "</div>";
        keyboard.append(element);
        element = keyboard.find("#key-" + keys[i]);
        element.css({
            left: x * 12 + "vmin",
            top: y * 12 + "vmin"
        });

        x ++;
        if (x >= 7) {
            x = 0;
            y ++;
        }
    }
    console.debug("Done. Binding events.");

    $(".key").on("touchstart mousedown", function (e) {
        e.preventDefault();

        if (!alive) {
            var key = e.currentTarget.innerHTML;
            if (key != "←" && key != "↵") {
                name += key;
                $("#name-area").text(name);
            } else if (key == "←") {
                if (name.length > 1) {
                    name = name.substring(0, name.length - 1);
                } else {
                    name = "";
                }
                $("#name-area").text(name);
            } else {

                var dom_death = $("#clear");
                var dom_death2 = $("#death");
                var dom_restart = $("#restart-fade");
                var game_area = $("#game_area");
                var title_screen = $("#title-screen");

                alive = false;
                dom_death.css(
                    {
                        width: 0,
                        height: 0,
                        opacity: 0,
                        top: e.pageY - title_screen.position().top + "px",
                        left: e.pageX - title_screen.position().left + "px"
                    }
                );
                dom_restart.css(
                    {
                        width: 0,
                        height: 0,
                        opacity: 0,
                        top: e.pageY - title_screen.position().top + "px",
                        left: e.pageX - title_screen.position().left + "px"
                    }
                );
                dom_restart.show();
                dom_death.animate(
                    {
                        width: '250vmin',
                        height: '250vmin',
                        opacity: 1
                    }, 1500, 'swing', function () {
                        $("#title-screen").hide();
                        game_area.show();
                        dom_death2.css(
                            {
                                width: '250vmin',
                                height: '250vmin',
                                opacity: 1
                            }
                        );
                        dom_death2.show();

                        dom_restart.animate(
                            {
                                width: '250vmin',
                                height: '250vmin',
                                opacity: 1
                            }, 1000, 'swing', function () {
                                dom_restart.fadeOut(400);
                                dom_death.hide();
                                dom_death2.hide();
                                score = 0;
                                last_spawn = performance.now() + 1000;
                                alive = true;
                            }
                        );
                        dom_restart.show();
                    }
                );
                dom_death.show();
            }
        }
    });

    $(document).on("touchstart mousedown", function (e) {
        e.preventDefault();

        if (alive) {
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
                if (kill[i].state.type != "triple" || kill[i].state.rings == 1) {
                    bubbles.splice(bubbles.indexOf(kill[i]), 1);

                    if (kill[i].state.type == "green") {
                        score++;
                        kill[i].dom.parent.remove();
                    } else if (kill[i].state.type == "red") {
                        trigger_death(kill[i]);
                    } else if (kill[i].state.type == "equation") {
                        if (kill[i].state.correct) {
                            score++;
                            kill[i].dom.parent.remove();
                        } else {
                            trigger_death(kill[i]);
                        }
                    } else if (kill[i].state.type == "triple") {
                        score++;
                        kill[i].dom.parent.remove();
                    } else if (kill[i].state.type == "split") {
                        score++;
                        kill[i].dom.parent.remove();

                        for (var j = 0; j < 3; j++) {
                            create_bubble();
                        }
                    }
                } else {
                    kill[i].dom.parent.find(".ring.ring" + kill[i].state.rings).remove();
                    kill[i].state.rings --;
                    kill[i].state.time_start = performance.now();
                }
            }
        }
    });

    load_osu();
});
