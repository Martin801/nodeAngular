const session = require("express-session");
var provider = require('./providerController');

module.exports = function (app) {
    app.get('/provider', function (req, res) {
        provider.home(req, res);
    });

    app.post('/provider/provider-login', function (req, res) {
        provider.login(req, res);
    });

    app.post('/provider/provider-register', function (req, res) {
        provider.register(req, res);
    });

    app.post('/api/provider/set-prescription', function (req, res) {
        provider.addPrescription(req, res);
    });

    app.get('/provider/logout', function (req, res) {
        req.session.destroy(function (err) {
            res.redirect('/provider');
        })
    });

    app.get('/api/provider/provider-details', function (req, res) {
        provider.providerDetails(req, res);
    });
    
    app.post('/api/provider/provider-update', function (req, res) {
        provider.editProvider(req, res);
    });

    app.post('/provider/provider-username-check', function (req, res) {
        provider.usernameCheck(req, res, 'provider');
    });

    app.post('/patient-username-check', function (req, res) {
        provider.patientUsernameCheck(req, res, 'patient');
    });
    app.post('/lab-username-check', function (req, res) {
        provider.labUsernameCheck(req, res, 'lab_user');
    });

    app.post('/provider/provider-email-check', function (req, res) {
        provider.emailCheck(req, res, 'provider');
    });

    /*API Routes*/

    app.post('/api/provider/patients-username-check', function (req, res) {
        provider.usernameCheck(req, res, 'patient');
    });



    app.get('/api/provider/patient-list', function (req, res) {
        provider.allPatients(req, res);
    });

    app.get('/api/provider/patient-details/:id', function (req, res) {
        provider.allPatients(req, res);
    });


    app.get('/api/provider/prescription-list/:username', function (req, res) {
        provider.allPrescriptions(req, res);
    });

    app.get('/api/provider/prescription-details/:id', function (req, res) {
        provider.singlePrescriptionDetails(req, res);
    });

app.post('/api/provider/provider-medication', function (req, res) {
        provider.addMedicationByProvider(req, res);
    });
app.get('/api/provider/medication-list/:username', function (req, res) {
        provider.allMedications(req, res);
    });
app.get('/api/provider/medication-details/:id', function (req, res) {
        provider.singleMedicationDetails(req, res);
    });

app.get('/api/provider/medication-list-by-prescription/:id', function (req, res) {
        provider.MedicationListByPrescription(req, res);
    });

    app.post('/api/provider/patient-register', function (req, res) {
        provider.addPatient(req, res);
    });


    app.post('/api/provider/patients-email-check', function (req, res) {
        provider.emailCheck(req, res, 'patient');
    });

app.get('/api/provider/checksluck', function (req, res) {
        provider.checksluck(req, res);
    });

    app.get('/api/provider/loginCheck', function (req, res) {
        provider.loginCheck(req, res);
    });

    app.get('/api/provider/logout', function (req, res) {
        req.session.destroy(function (err) {
            console.log(req.session);
            res.send("You have logout successfully!!");
        })
    });
//====================Appointment==============================//

app.get('/api/provider/get-appointment', function (req, res) {
        provider.getAppointmentByProvider(req, res);
    });
app.get('/api/provider/get-appointment-details/:id', function (req, res) {
        provider.getAppointmentDetails(req, res);
    });
app.get('/api/provider/get-appointment-schedule/:id', function (req, res) {
        provider.getAappointmentSchedule(req, res);
    });
app.post('/api/provider/update-appointment-schedule', function (req, res) {
        provider.updateAappointmentByProvider(req, res);
    });

app.post('/api/provider/cancel-appointment', function (req, res) {
        provider.cancelAappointmentByProvider(req, res);
    });



app.get('/api/provider/form-list', function (req, res) {
        provider.getForms(req, res);
    });
app.get('/api/provider/patients-form-list/:username', function (req, res) {
        provider.patientgetForms(req, res);
    });

app.get('/api/provider/provider-assigned-form/:id', function (req, res) {
        provider.providerAssignedForms(req, res);
    });

//=============================================================//

//=======================CLINIC================================//
app.post('/api/provider/add-clinic', function (req, res) {
        provider.addClinic(req, res);
    });
app.get('/api/provider/all-clinic', function (req, res) {
        provider.allClinic(req, res);
    });
app.get('/api/provider/clinic-details/:id', function (req, res) {
        provider.clinicDetails(req, res);
    });

app.get('/api/provider/remove-clinic/:id', function (req, res) {
        provider.removeClinic(req, res);        
    });
//=============================================================//
//======================LAB====================================//

app.post('/api/provider/lab/add-lab', function (req, res) {       
        provider.addLab(req, res);        
    });
app.get('/api/provider/lab/showall', function (req, res) {
        provider.allLabs(req, res);
    });
app.get('/api/provider/lab/lab-details/:id', function (req, res) {
        provider.allLabs(req, res);        
    });
app.get('/api/provider/lab/remove-lab/:id', function (req, res) {
        provider.removeLab(req, res);        
    });
//=============================================================//
    app.get('/api/provider/country', function (req, res) {
        provider.getCountry(req, res);
    });

    app.get('/provider/dashboard*', function (req, res) {
        provider.dashboard(req, res);

    });

    app.get('/api/provider/logout', function (req, res) {
        req.session.destroy(function (err) {
            console.log(req.session);
            res.send("You have logout successfully!!");
        })
    });

    /* app.get('/provider/dashboard*', function (req, res) {
         provider.loginAuthCheck(req, res, function () {
             provider.dashboard(req, res);
         })
     });*/
};
