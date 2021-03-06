
/* Initialize and bind targets to buttons */
$(document).ready(function() {
    populateTable();
    $('#btnAddUser').on('click', addUser);
    refreshAnnouncements();
    // Typing return can add someone to the queue
    $('#inputUserName').bind('keypress', handleKeyPressInAdd);
    $('#inputUserAndrewId').bind('keypress', handleKeyPressInAdd);
    $('#inputUserProblem').bind('keypress', handleKeyPressInAdd);

    $('#addUser input').on('click', resetInput);
    refreshHelpStudent();
    $('#userList').on('click', 'a.linkdeleteuser', deleteUser);
    socket.on('add', function(data) {
        updateAdd(data);
        setAverageHelpTime();
    });
    socket.on('delete', function(data) {
        updateDelete(data);
        setAverageHelpTime();
    });
    socket.on('refresh', function(data) {
        refreshTitle();
        refreshAnnouncements();
        setAverageHelpTime();
    });

});

function handleKeyPressInAdd(e) {
    if (e.keyCode === 13) {
        addUser(e);
    }
}

function refreshHelpStudent() {
    if (isLoggedIn()) {
        $('div#helpStudents').html("<center> <a class='waves-effect waves-light btn' id='btnHelpStudent'> Help next student </a> </center>");
    }
    else {
        $('div#helpStudents').html('');
    }
}

function refreshAnnouncements() {
    if (get_bulletin() != '') {
        $('#courseBulletin').html('<div class = "row"> <center> <h4>' + get_bulletin() + ' </h4> </center> </div>');
    }
    else {
        $('#courseBulletin').html('');
    }
}


function get_bulletin() {
    return $.ajax({
        type: 'GET',
        url: '/getbulletin',
        dataType: 'JSON',
        async: false,
    }).responseJSON.msg;
}

function get_name() {
    return "<a href='#' class= 'brand-logo'>" + $.ajax({
        type: 'GET',
        url: '/getname',
        dataType: 'JSON',
        async: false,
    }).responseJSON.msg + '</a>';
}



/* resetInput - Makes input box color change back to neutral */
function resetInput(event) {
    event.preventDefault();
    $(this).css('border-color', 'initial');
}

/* getTimeHelped - Takes time boject, calculates the amount of time
                    in minutes it took the person to get helped
*/
function getTimeHelped(time) {
    return (new Date().getTime() - time) / 1000 / 60;
}


/* setAverageHelpTime - calculates average help time for next person
    to enter the queue */
function setAverageHelpTime() {
    // Get all the help times by JSON call
    return $.getJSON('/users/gettimes', function(data) {
        var time = data.time;
    
        $('#averageHelpTime').html("<font color='gray'> Average Help Time: </font>" + Math.round(time) + ' minute(s)');

        if (time > 30) {
            $('#averageHelpTime').css('color', 'red');
        }
        else if (time > 15) {
            $('#averageHelpTime').css('color', 'orange');
        }
        else {
            $('#averageHelpTime').css('color', 'green');
        }
    });

    /* TO DO */
    //Take the average help time length, and multiply by how many people are in the queue


}

/* deleteUser - Delete user, keep track of new average time */
function deleteUser(event) {
    if (!localStorage.sessionKey) {
        toast('Nice try');
    }
    else {
        event.preventDefault();
        var time = $(this).attr('time');
        var userId = $(this).attr('id');
        trackTime({time: getTimeHelped(time)});
        // Only consider cases when time took more than one minute
        $.ajax({
            type: 'DELETE',
            url: '/users/deleteuser/'+ userId
        }).done(function(response) {
            if (response.msg === '') {
                //Update table
                socket.emit('delete', {key: localStorage.sessionKey, user: userId});
            } else {
                toast(response.msg, 1000);
            }
        });
    }

}

/* trackTime- Tell the server the new time */
function trackTime(newTime) {
    $.ajax({
            type: 'POST',
            data: newTime,
            url: '/users/tracktime',
            dataType: 'JSON'
        }).done(function(response) {
        });
}

/* addUser - Add a user to the queue, with spam check */
function addUser(event) {
    $(this).css('outline', 'none');
    event.preventDefault();

    var errorCount = 0;
    $('#addUser input').each(function(index, val) {
        if ($(this).val().trim() === '') {
            $(this).css('border-color', '#ff5722');
            errorCount++;
        }
    });

    if (errorCount === 0) {
        var newUser = {
            'name': $('input#inputUserName').val(),
            'andrewId': $('input#inputUserAndrewId').val(),
            'problem': $('input#inputUserProblem').val(),
        };

        /* Check the user hasn't added in the last 10 seconds since last call */
        for (var i = 0; i < userListData.length; i++) {
            if (localStorage.lastAdd) {
                    if (new Date().getTime() - localStorage.lastAdd < 10000) {
                        toast("You can't add yourself so quickly since your last add", 750);
                        return;
                    }
            }
        }
        /* Send to server */
        $.ajax({
            type: 'POST',
            data: newUser,
            url: '/users/adduser',
            dataType: 'JSON'
        }).done(function(response) {
            if (response.success) {
                $('input#inputUserProblem').val('');
                //socket.emit('update', {command:'add', user: newUser});
                //newUser
                // response the newUser plus the field id which is generated
                // by mongoDB
                socket.emit('add', {user: response.user[0]});
                //populateTable();
                toast('Entered the queue!', 750);
            } else {
                toast(response.msg, 750);
            }
            localStorage.lastAdd = new Date().getTime();
        });
    } else {
        return false;
    }
}




function updateDelete(update) {
    $('#'+ update.user).parent().parent().next('br').remove();
    $('#'+ update.user).parent().parent().remove();
}

function updateAdd(update) {
    var loggedin = isLoggedIn();
    var content = '';
    content += '<div class="row">';
    content += '<div class = "col s2">' + update.user.name + '</div>';
    content += '<div class = "col s2">' + update.user.andrewId + '</div>';
    if (loggedin) {
        content += '<div class = "col s6">' + update.user.problem + '</div>';
        content += '<div class = "col s2"> <a href="#" class="waves-effect waves-light btn linkdeleteuser" time=' + update.user.timestamp + ' id="' + update.user._id + '">Help </a></div>';

    } else {
        content += '<div class = "col s6">' + update.user.problem + '</div>';
    }
    content += '</div>';

    $('#userList').append(content);
}
