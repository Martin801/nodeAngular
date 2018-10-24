app.controller('appointmentController', function ($scope, $q, $route, $window, $routeParams, $http, $location) {
    $scope.loginCheck();
    $http.get($scope.apiurl + 'get-appointment').then(function (results) {
        console.log(results);
        $scope.allAppointments = results.data;
    });
});

app.controller('appointmentDetailController', function ($scope, $q, $route, $window, $routeParams, $http, $location) {
    $scope.appointment = {};
    $scope.appointment.newDate = {};
    $scope.loginCheck();
    $q.all([$http.get($scope.apiurl + 'get-appointment-details/' + $routeParams.id), $http.get($scope.apiurl + 'get-appointment-schedule/' + $routeParams.id), $http.get($scope.apiurl + 'all-clinic')]).then(function (results) {
        $scope.appointment = results[0].data[0];
        $scope.appointment.date = results[1].data;
        $scope.appointment.appDate = results[1].data[0].id;
        $scope.allClinics = results[2].data;

        if ($scope.appointment.status == 1) {
            $scope.appointment.clinic = $scope.allClinics[0];
        } else {
            angular.forEach($scope.allClinics, function (value, key) {
                if ($scope.appointment.clinic_id = value.id) {
                    $scope.appointment.clinic = value
                }
            });
        }

        $(function () {
            $(".mydatepicker").datepicker({
                changeMonth: true,
                changeYear: true,
                minDate: 0
            });

            $('.selectSearch select').select2({
                //templateResult: formatOptions
            });
        });
    });

    $scope.submitAppointment = function () {

        if ($scope.appointment.appDate == undefined) {
            swal({
                text: "You Have To Select Appointment Date and Time.",
                icon: "error",
                button: "OK",
            });
            return;
        }

        if ($scope.appointment.appDate == "") {
            if (!$scope.appointment.newDate) {
                swal({
                    text: "You Have To Select New Appointment Date.",
                    icon: "error",
                    button: "OK",
                });
                return;
            }
            if (!$scope.appointment.newDate.date) {
                swal({
                    text: "You Have To Select New Appointment Date.",
                    icon: "error",
                    button: "OK",
                });
                return;
            }
            if (!$scope.appointment.newDate.time) {
                swal({
                    text: "You Have To Select New Appointment Time.",
                    icon: "error",
                    button: "OK",
                });
                return;
            }
        }

        if (!blankCheck($scope.appointment.clinic, 'You have to give Appointment Address.')) {
            return false;
        }

        $scope.appointment.clinic_id = $scope.appointment.clinic.id;

        if (!$scope.appointment.doctor_comments) {
            $scope.appointment.doctor_comments = "";
        }

        $scope.appointment.providerDetails = $scope.providerDetails;
        var data = JSON.stringify($scope.appointment);

        $http.post($scope.apiurl + "update-appointment-schedule", data, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        }).then(function (res) {
            angular.element("#bgLoader").hide();
            swal({
                text: "You Have Accepted This Appointment.",
                icon: "success",
                button: "OK",
            }).then(function () {
                $route.reload();
            })
        });
    };

    $scope.cancelAppointment = function (n) {
        $scope.appointment.providerDetails = $scope.providerDetails;
        var data = JSON.stringify($scope.appointment);
        swal({
            text: "Are You Sure You Want To Cancel This Appointment?",
            icon: "warning",
            buttons: [true, "Yes!"],
        }).then(function (v) {
            angular.element("#bgLoader").show();
            $http.post($scope.apiurl + "cancel-appointment", data, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then(function (res) {
                angular.element("#bgLoader").hide();
                swal({
                    text: "You Have Accepted This Appointment.",
                    icon: "success",
                    button: "OK",
                }).then(function () {
                    $location.path("appointments");
                })
            });
        });
    };

});
