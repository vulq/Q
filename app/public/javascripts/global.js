// TODO: Global vairable is bad
var userListData = []; 

$(document).ready(function() {
    $('#btnAddUser').on('click', addUser);
    $('#addUser input').on('change', resetInput);
    $('#userList table tbody').on('click', 'td a.linkdeleteuser', deleteUser);
    populateTable();
});

function resetInput(event) {
    event.preventDefault();
    $(this).css("border-color", "initial")
}

function deleteUser(event) {
    event.preventDefault();

    var confirmation = confirm('Are you sure you want to delete?');
        
    if (confirmation === true) {
        $.ajax({
            type: "DELETE",
            url: "/users/deleteuser/"+$(this).attr('rel')
        }).done(function(response) {
            if (response.msg === '') {
            } else {
                alert('Error: ' + response.msg);
            }
            //update table
            populateTable();
        });
    } else {
        // If they said no to the confirm, do nothing
        return false;
    }
}

function addUser(event) {
    event.preventDefault();

    var errorCount = 0;
    $('#addUser input').each(function(index, val) {
        if ($(this).val() === '') {
            $(this).css("border-color", "#ff5722")
            errorCount++
        };
    });

    if (errorCount === 0) {
        var newUser = {
            'name': $('#addUser fieldset input#inputUserName').val(),
            'andrewId': $('#addUser fieldset input#inputUserAndrewId').val(),
            'problem': $('#addUser fieldset input#inputUserProblem').val(),
        }
        $.ajax({
            type: "POST",
            data: newUser,
            url: '/users/adduser',
            dataType: 'JSON'
        }).done(function(response) {
            if (response.msg === '') {
                $('#addUser fieldset input#inputUserProblem').val('')               
                populateTable();
            } else {
                alert('Error: ' + response.msg);
            }
        });
    } else {
        return false;
    }
}

function populateTable() {
    var tableContent = '';

    // jQuery AJAX call for JSON
    $.getJSON('/users/userlist', function(data) {
        userListData = data;
        $.each(data, function() {
            tableContent += '<tr>';
            tableContent += '<td>' + this.name + '</td>';
            tableContent += '<td>' + this.andrewId + '</td>';
            tableContent += '<td>' + this.problem + '</td>';
            tableContent += '<td><a href="#" class="linkdeleteuser" rel="' + this._id + '">delete</a></td>';
            tableContent += '</tr>';
        });

        $('#userList table tbody').html(tableContent);
    });
}
