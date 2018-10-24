const express = require('express');
var app = express();
const session = require("express-session");
const sql = require('mysql');
const url = require('url');
const bodyParser = require('body-parser');
const multer = require('multer');
var path = require("path");
var nodemailer = require('nodemailer');
var fs = require('fs');
var configUrl = require('../../config');
var paypal = require('paypal-rest-sdk');
var async = require('async');
var emailfunction = require('../../email/controller/emailController');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

paypal.configure({
    'mode': 'sandbox',
    'client_id': configUrl.payPal.client_id,
    'client_secret': configUrl.payPal.secret,
    'headers': {
        'custom': 'header'
    }
});
// config for your database
var config = {
    user: 'medteam_user',
    password: 'zZ9=cg#_j%?G',
    server: 'localhost',
    database: 'medteam_db'
};

// connect to your database
var connect = sql.createConnection(config, function (err) {
    if (err) console.log(err);
});

// Create a SMTP transporter object
var transporter = nodemailer.createTransport({
    host: 'lazda.theaquarious.com',
    port: '465',
    secure: true,
    debug: true,
    auth: {
        user: 'developer@medteam.com',
        pass: 'K3b2]@vr%c;e'
    }
});


function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

module.exports = {
    home: function (req, res) {
        async.parallel({
            one: function (callback) {

                var call = `call admin_getAllCountry('1','')`;

                connect.query(call, true, function (error, results, fields) {
                    callback(null, results);
                });
            },
            two: function (callback) {
                var call = `call admin_getAllSpeciality('1','')`;
                connect.query(call, true, function (error, results, fields) {
                    callback(null, results);
                });
            },
            three: function (callback) {
                var call = `call admin_getAllsubscriptions('1','')`;
                connect.query(call, true, function (error, results, fields) {
                    callback(null, results);
                });
            }
        }, function (err, results) {
            res.render('frontend/provider_ejs/home', {
                country: results['one'][0],
                specialty: results['two'][0],
                membership: results['three'][0]
            });
        });
    },

//+++++++++++++++++++++++++++ADD LAB+++++++++++++++++++++++++++++++++++++++//

addLab: function (req, res) {


        var storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, './public/uploads/labs')
            },
            filename: function (req, file, cb) {
                var datetimestamp = Date.now();
                cb(null, "lab_" + file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
            }
        });

        var upload = multer({
            storage: storage,
            fileFilter: function (req, file, callback) {
                var ext = path.extname(file.originalname);
                if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
                    res.send({
                        message: "Only jpg, png, gif, jpeg are allowed."
                    });
                    return callback(null, false);
                }
                callback(null, true);
            },
        }).any();

        upload(req, res, function (err) {
            var fileName;
            var userId;
            if(req.files){
               if (req.files.length < 1) {
                fileName = "";
            } else {
                fileName = req.files[0].filename;
            } 
            }
            

            if (req.body.id == 0) {
                labId = "";
            } else {
                labId = req.body.id;
            }

            if (err) {
                res.json({
                    error_code: 1,
                    err_desc: err
                });
                return;
            } else {
                var call = `call provider_setLabUser('` + req.body.lab_name + `', '` + req.body.contact_name + `', '` + req.body.email + `', '` + req.body.phone + `', '` + req.body.country + `', '` + req.body.phone_prefix + `', '` + req.body.fax + `', '` + req.body.address + `', '` + req.body.occupation + `', 'provider', '`+req.session.providerID+`', '0', '` + labId + `', @providerID, @errorMessage)`;
                connect.query(call, true, function (error, results, fields) {
                    if (error) {
                        res.send("error");
                        return console.error(error.message);
                    } else {


                                var email = req.body.email;
                                let buff = new Buffer(email);
                                let base64Email = buff.toString('base64');

                                var staticemail = 'aquatechdev2@gmail.com';
                                var baseurl = configUrl.baseUrl;
                                var passwordurl = baseurl + 'lab/create-login/' + base64Email;
                                emailfunction.labusercreateLoginEmail(req.body, passwordurl);

                        res.send({
                            status: "success"
                        });
                    }
                });
            }  
        });
    },

 allLabs: function (req, res) {
        if (req.params.id) {
            var call = `call admin_getAllLabUser('','` + req.params.id + `')`;
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send(results[0]);
                    return console.error(error.message);
                } else {
                    res.send(results[0]);
                }
            });
        } else {
            var call = `call admin_getAllLabUser('','')`;
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send(results[0]);
                    return console.error(error.message);
                } else {
                    res.send(results[0]);
                }
            });
        }
    },


removeLab: function (req, res) {
       
    var call = `call admin_setStatus('lab_user','` + req.params.id + `','2', @errorMessage, @successMessage)`;
        connect.query(call, true, function (error, results, fields) {
            if (error) {
                res.send("error");
                return console.error(error.message);
            } else {
            
               res.send('success');
            }
        });
    },


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//




//++++++++++++++++++++++++++++ADD CLINIC+++++++++++++++++++++++++++++++++++//

addClinic: function (req, res) {
        //console.log(req.body);
        if (req.session.providerID) {
            if (req.body.id == 0) {
                clid = "";
            } else {
                clid = req.body.id;
            }            

            var call = `call add_doctorClinic('`+req.body.name+`','`+req.body.country_id+`','`+req.session.providerID+`','`+req.body.city+`','`+req.body.phone_prefix+`','`+req.body.phone_no+`','`+req.body.address+`','`+req.body.pin+`','`+req.body.status+`','`+clid+`',@clinicID,@errorMessage)`;
            console.log(call);
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send("error");
                    return console.error(error.message);
                } else {

                    res.send({
                        status: "success"
                    });
                }
            });
        } else {
            res.send("error");
        }
    },


allClinic: function (req, res) {
        if (req.session.providerID) {
            var call = `call get_clinic('','`+req.session.providerID+`','')`;
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send(results[0]);
                    return console.error(error.message);
                } else {
                    res.send(results[0]);
                }
            });
        } else {
            res.send('error');
        }

    },


clinicDetails: function (req, res) {
        if (req.session.providerID) {
            if (req.params.id) {
            var call = `call get_clinic('','`+req.session.providerID+`','`+req.params.id+`')`;
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send(results[0]);
                    return console.error(error.message);
                } else {
                    res.send(results[0]);
                }
            });
            } else {
            res.send('error');
        }
        } else {
            res.send('error');
        }

    },

removeClinic: function (req, res) {
       
    var call = `call provider_setStatuschange('doctor_clinic','` + req.params.id + `','2', @errorMessage, @successMessage)`;
        connect.query(call, true, function (error, results, fields) {
            if (error) {
                res.send("error");
                return console.error(error.message);
            } else {
            
               res.send('success');
            }
        });
    },

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//



    //+++++++++++++++++++++++++PRESCRIPTION LIST+++++++++++++++++++++++++++++++++++++++++++++//
    allPrescriptions: function (req, res) {
        if (req.session.providerID) {
            var call = `call provider_getPatientByslack('','` + req.params.username + `')`;
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send(results[0]);
                    return console.error(error.message);
                } else {
                    var patientId = results[0][0]['id'];
                    var call2 = `call provider_getAllPrescriptionbyPatient('','` + req.session.providerID + `','` + patientId + `','')`;
                    connect.query(call2, true, function (error2, results2, fields) {
                        if (error2) {
                            res.send(results2[0]);
                            return console.error(error2.message);
                        } else {
                            res.send(results2[0]);
                        }
                    });
                }
            });
        } else {
            res.send('error');
        }

    },
    //==================================================================================//

    //+++++++++++++++++++++++++SINGLE PRESCRIPTION DETAILS+++++++++++++++++++++++++++++++++++++++++++++//
    singlePrescriptionDetails: function (req, res) {
        if (req.session.providerID) {
            var call2 = `call provider_getAllPrescriptionbyPatient('','` + req.session.providerID + `','','` + req.params.id + `')`;
            connect.query(call2, true, function (error2, results2, fields) {
                if (error2) {
                    res.send('error');
                    return console.error(error2.message);
                } else {
                    res.send(results2[0]);
                }
            });
        } else {
            res.send('error');

        }
    },
    //==================================================================================//



    //+++++++++++++++++++++++++MEDICATION LIST+++++++++++++++++++++++++++++++++++++++++++++//
    allMedications: function (req, res) {
        if (req.session.providerID) {
            var call = `call provider_getPatientByslack('','` + req.params.username + `')`;
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send(results[0]);
                    return console.error(error.message);
                } else {
                    var patientId = results[0][0]['id'];
                    var call2 = `call provider_getAllMedicationbyPatient('','` + req.session.providerID + `','` + patientId + `','')`;
                    connect.query(call2, true, function (error2, results2, fields) {
                        if (error2) {
                            res.send(results2[0]);
                            return console.error(error2.message);
                        } else {
                            res.send(results2[0]);
                        }
                    });
                }
            });
        } else {
            res.send('error');
        }

    },
    //==================================================================================//

    //+++++++++++++++++++++++++SINGLE Medication DETAILS+++++++++++++++++++++++++++++++++++++++++++++//
    singleMedicationDetails: function (req, res) {
        if (req.session.providerID) {
            var call2 = `call provider_getAllMedicationbyPatient('','` + req.session.providerID + `','','` + req.params.id + `')`;
            connect.query(call2, true, function (error2, results2, fields) {
                if (error2) {
                    res.send('error');
                    return console.error(error2.message);
                } else {
                    res.send(results2[0]);
                }
            });
        } else {
            res.send('error');

        }
    },
    //==================================================================================//


    //+++++++++++++++++++++++++Medication List by Prescription+++++++++++++++++++++++++++++++++++++++++++++//
    MedicationListByPrescription: function (req, res) {
        if (req.session.providerID) {
            var call2 = `call provider_getAllMedicationbyPrescription('','` + req.session.providerID + `','` + req.params.id + `')`;
            connect.query(call2, true, function (error2, results2, fields) {
                if (error2) {
                    res.send('error');
                    return console.error(error2.message);
                } else {
                    res.send(results2[0]);
                }
            });
        } else {
            res.send('error');

        }
    },
    //==================================================================================//



    //==========================Add Update Medication===============================//

    addMedicationByProvider: function (req, res) {
        //console.log(req.body);
        if (req.session.providerID) {
            if (req.body.id == 0) {
                mid = "";
            } else {
                mid = req.body.id;
            }

            var call = `call all_add_medication('` + req.body.name + `','` + req.body.dosage + `','` + req.body.instruction + `','` + req.body.what_its_for + `','` + req.body.who_prescribed_it + `','` + req.body.where_you_get_it + `','` + req.body.phone_no + `','` + req.body.prescription_id + `','` + req.body.patient_id + `','` + req.session.providerID + `','` + req.body.drug_exp_date + `','` + req.body.start_date + `','` + req.body.end_date + `','` + req.body.prescription_no + `', '` + req.body.prescription_date + `', '` + req.body.refills_left + `', '` + req.body.refills_exp_date + `', '` + req.body.refills_ordered_on + `', '` + req.body.when_last_filled + `','1','` + mid + `', @medicationID, @errorMessage)`;
            console.log(call);
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send("error");
                    return console.error(error.message);
                } else {

                    res.send({
                        status: "success"
                    });
                }
            });
        } else {
            res.send("error");
        }

    },

    //==============================================================================//


    addPrescription: function (req, res) {
        //console.log(req.body);
        if (req.session.providerID) {
            if (req.body.id == 0) {
                pid = "";
            } else {
                pid = req.body.id;
            }
            var prescriptionNo = uuidv4();

            var call = `call provider_setprescription('` + req.session.providerID + `', '` + req.body.patient_id + `', '` + req.body.title + `', '` + req.body.prescription_date + `', '` + req.body.type + `', '` + req.body.what_its_for + `', '` + prescriptionNo + `', '` + req.body.description + `', '` + req.body.phone + `', '1','` + pid + `', @prescriptionID, @errorMessage)`;
            console.log(call);
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send("error");
                    return console.error(error.message);
                } else {

                    res.send({
                        status: "success"
                    });
                }
            });
        } else {
            res.send("error");
        }

    },

    register: function (req, res) {
        var errors = "";
        var package = req.body.package;
        var packages = package.split("_");
        var packageId = packages[0];
        var packageTime = packages[1];
        var packagePrice = packages[2];
        var country = req.body.country;
        var countries = country.split("_");
        var countryId = countries[0];
        var countryCode = countries[1];

        //--------------------------Paypal payment--------------------------------//
        var expmonth = '"' + req.body.expMonth + '"';
        console.log(expmonth);
        var create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "credit_card",
                "funding_instruments": [{
                    "credit_card": {
                        "type": req.body.cardType,
                        "number": req.body.cardNumber,
                        "expire_month": req.body.expMonth,
                        "expire_year": req.body.expYear,
                        "cvv2": req.body.cardCvv,
                        "first_name": req.body.cardFName,
                        "last_name": req.body.cardLName,
                        "billing_address": {
                            "line1": "",
                            "city": req.body.city,
                            "state": "",
                            "postal_code": req.body.zipcode,
                            "country_code": countryCode
                        }
                    }
		        }]
            },
            "transactions": [{
                "amount": {
                    "total": packagePrice,
                    "currency": "USD",
                    "details": {
                        "subtotal": packagePrice,
                        "tax": "0",
                        "shipping": "0"
                    }
                },
                "description": "This is the payment transaction description."
		    }]
        };


        paypal.payment.create(create_payment_json, function (error8, payment) {
            if (error8) {
                //throw error8;
                console.log(error8);
                res.send('payment_error');
            } else {
                var call = `call provider_addUpdate('` + req.body.fname + `','` + req.body.lname + `','` + req.body.email + `','` + req.body.userName + `','` + countryId + `','` + req.body.zipcode + `','` + req.body.fname + `','','` + req.body.phone + `','` + req.body.phone_prefix + `','` + req.body.dob + `','','` + req.body.password + `','` + req.body.address + `','` + req.body.city + `','','','','3','','','','` + req.body.pln + `','', @providerID, @errorMessage)`;

                console.log(call);
                connect.query(call, true, function (error, results, fields) {
                    if (error) {
                        console.log(error);
                    } else {

                        var providerId = results[0][0].providerID;

                        var call2 = `call provider_addUpdateSubscriptions('` + providerId + `','` + packageId + `','` + packageTime + `', @subscriptionsID,@errorMessage)`;
                        connect.query(call2, true, function (error2, results2, fields) {
                            if (error2) {
                                console.log(error2);
                            } else {
                                var subscriptionsID = results2[0][0].subscriptionsID;
                                console.log('subscriptionsID=>' + subscriptionsID);
                                var transactionId = payment.id;
                                var transactionStatus = payment.state;
                                var paymentdata = JSON.stringify(payment);
                                var call4 = `call provider_addTransaction('` + providerId + `','` + subscriptionsID + `','` + transactionId + `','` + transactionStatus + `','` + packagePrice + `','` + paymentdata + `',@providerID,@errorMessage)`;
                                connect.query(call4, true, function (error4, results4, fields) {
                                    if (error4) {
                                        res.send('error');
                                        //return console.error(error4.message);
                                    } else {
                                        var ppproviderId = results4[0][0].providerID;
                                        console.log('payment_providerId2=>' + ppproviderId);
                                        //res.send(results4[0]);

                                        //==================Register mail==========================//
                                        emailfunction.providerRegisterEmail(req.body);

                                        /*var email = req.body.email;
                                        var testemail='aquatechdev2@gmail.com';
                                        var message = {
                                        from: 'MedTeam <info@medteam.com>',
                                        to: testemail,
                                        subject: 'Register on MedTeam',
                                        text: 'Welcome To MedTeam!',
                                        html: '<p><b>Welcome</b> To MedTeam! You are successfully registered on TedTeam.</p>'
                                        };

                                        transporter.sendMail(message, function (err, info) {
                                        if (err) {
                                        console.log('Error occurred. ' + err.message);
                                        //return process.exit(1);
                                        }
                                        console.log('Message sent: %s', info.messageId);
                                        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                                        });*/
                                        //===============================================================//
                                    }
                                });
                                console.log('success');
                                res.send('register_success');
                            }
                        });
                    }
                });

                console.log("Create Payment Response");
                console.log(payment);
            }
        });

    },

    providerDetails: function (req, res) {
        if (req.session.providerID) {
            var call = `call admin_getAllProvider('','` + req.session.providerID + `')`;
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send(results[0]);
                    return console.error(error.message);
                } else {
                    res.send(results[0]);
                }
            });
        } else {
            res.send('Error');
        }
    },


    /*editProvider: function (req, res) {
            var errors = "";
            var package = req.body.package;
            var packages = package.split("_");
            var packageId = packages[0];
            var packageTime = packages[1];
            var call = `call provider_addUpdate('` + req.body.fname + `','` + req.body.lname + `','` + req.body.email + `','` + req.body.userName + `','` + req.body.country + `','` + req.body.zipcode + `','` + req.body.fname + `','','` + req.body.phone + `','` + req.body.phone_prefix + `','` + req.body.dob + `','','` + req.body.password + `','` + req.body.address + `','` + req.body.city + `','','','','1','','','','` + req.session.providerID + `', @providerID, @errorMessage)`;

            console.log(call);
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    console.log(error);
                } else {
                    var providerId = results[0]['providerID'];
                    var call2 = `call provider_addUpdateSubscriptions('` + providerId + `','` + packageId + `','` + packageTime + `', @subscriptionsID,@errorMessage)`;
                    connect.query(call2, true, function (error2, results2, fields) {
                        if (error2) {
                            console.log(error2);
                        } else {
                            //==================Register mail==========================//
                            var email = req.body.email;
                            var message = {
                                from: 'MedTeam <info@medteam.com>',
                                to: email,
                                subject: 'MedTeam',
                                text: 'Welcome To MedTeam!',
                                html: '<p><b>Welcome</b> To MedTeam!</p>'
                            };

                            transporter.sendMail(message, function (err, info) {
                                if (err) {
                                    console.log('Error occurred. ' + err.message);
                                    //return process.exit(1);
                                }
                                console.log('Message sent: %s', info.messageId);
                                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                            });
                            //===============================================================//
                            res.send(results2[0]);
                        }
                    });
                }
            });

        },*/

    editProvider: function (req, res) {
        var storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, './public/uploads/providers')
            },
            filename: function (req, file, cb) {
                var datetimestamp = Date.now();
                cb(null, "provider_" + file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
            }
        });

        var upload = multer({
            storage: storage,
            fileFilter: function (req, file, callback) {
                var ext = path.extname(file.originalname);
                if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
                    res.send({
                        message: "Only jpg, png, gif, jpeg are allowed."
                    });
                    return callback(null, false);
                }
                callback(null, true);
            },
        }).any();

        upload(req, res, function (err) {
            var fileName;
            var userId;

            console.log(req.files.length);

            if (req.files.length < 1) {
                fileName = "";
            } else {
                fileName = req.files[0].filename;
            }

            if (req.body.id == 0) {
                userId = "";
            } else {
                userId = req.body.id;
            }

            if (err) {
                res.json({
                    error_code: 1,
                    err_desc: err
                });
                return;
            } else {
                var call = `call provider_addUpdate('` + req.body.first_name + `', '` + req.body.last_name + `', '` + req.body.email + `', '` + req.body.user_name + `', '` + req.body.country + `', '` + req.body.zipcode + `', '` + req.body.assistant_name + `', '` + req.body.fax + `', '` + req.body.phone + `', '` + req.body.phone_prefix + `', '` + req.body.dob + `', '` + req.body.gender + `', '` + req.body.password + `', '` + req.body.address + `', '` + req.body.city + `', '` + req.body.about + `', '` + req.body.occupation + `', '` + req.body.education + `', '1', '` + fileName + `', 'provider', '` + req.session.providerID + `','` + req.body.pln + `', '` + req.session.providerID + `', @providerID, @errorMessage)`;

                console.log(call);

                connect.query(call, true, function (error, results, fields) {
                    if (error) {
                        res.send("error");
                        return console.error(error.message);
                    } else {
                        res.send({
                            status: "success"
                        });
                    }
                });
            }
        });

    },

    login: function (req, res) {
        var call = `call provider_UserAuthentication('` + req.body.user + `','` + req.body.pass + `', @userID, @errorMessage, @userFname, @userLname);`;
        connect.query(call, true, function (error, results, fields) {
            if (error) {
                res.send(error);
            } else {
                req.session.providerID = results[0][0].userID;
                req.session.providerFname = results[0][0].userFname;
                req.session.providerLname = results[0][0].userLname;
                res.send(results[0]);
            }
        });
    },

    loginAuthCheck: function (req, res, _callback) {
        var call = `call common_checkprovider('` + req.session.providerID + `')`;
        connect.query(call, true, function (error, results, fields) {
            if (error) {
                return false;
            } else {
                //res.send(results[0]);
                if (results[0][0].status == 1) {
                    //_callback();
                    return true;
                } else {
                    res.send("Sorry!! You are not authorised provider.");
                    return false;
                }
            }
        });
    },

    loginCheck: function (req, res, _callback) {
        if (req.session.providerID) {
            var call = `call common_checkprovider('` + req.session.providerID + `')`;
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    return false;
                } else {
                    //res.send(results[0]);
                    if (results[0][0].status == 1) {
                        //_callback();
                        res.send("success");
                        return true;
                    } else {
                        req.session.destroy();
                        res.send("error");
                        return false;
                    }
                }
            });
        } else {
            res.send("error");
        }
    },

    getCountry: function (req, res, val) {
        var call = `call admin_getAllCountry('1','')`;
        connect.query(call, true, function (error, results, fields) {
            if (error) {
                res.send(error);
            } else {
                res.send(results[0]);
            }
        });
    },

    usernameCheck: function (req, res, val) {
        console.log(req.body);
        var call = `call common_usernamecheck('` + val + `','` + req.body.userName + `', @errorMessage, @successMessage)`;
        connect.query(call, true, function (error, results, fields) {
            if (error) {
                res.send(error);
            } else {
                res.send(results[0]);
            }
        });
    },

    patientUsernameCheck: function (req, res, val) {
        console.log(req.body);
        var call = `call common_usernamecheck('` + val + `','` + req.body.userName + `', @errorMessage, @successMessage)`;
        connect.query(call, true, function (error, results, fields) {
            if (error) {
                res.send(error);
            } else {
                res.send(results[0]);
            }
        });
    },

labUsernameCheck: function (req, res, val) {
        console.log(req.body);
        var call = `call common_usernamecheck('` + val + `','` + req.body.userName + `', @errorMessage, @successMessage)`;
        connect.query(call, true, function (error, results, fields) {
            if (error) {
                res.send(error);
            } else {
                res.send(results[0]);
            }
        });
    },



    emailCheck: function (req, res, val) {
        //console.log(req.body);
        var call = `call common_emailcheck('` + val + `','` + req.body.email + `', @errorMessage, @successMessage)`;
        connect.query(call, true, function (error, results, fields) {
            if (error) {
                res.send(error);
            } else {
                res.send(results[0]);
            }
        });
    },

    //+++++++++++++++++++++++++PATIENT LIST+++++++++++++++++++++++++++++++++++++++++++++//
    allPatients: function (req, res) {
        if (req.params.id) {
            var call = `call provider_getPatientByslack('','` + req.params.id + `')`;
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send(results[0]);
                    return console.error(error.message);
                } else {
                    //res.send(results[0]);
                    if (results[0][0]) {

                        if (results[0][0]['added_by_id'] == req.session.providerID) {
                            res.send(results[0]);
                        } else {
                            res.send('Error');
                        }

                    } else {
                        res.send('Error');
                    }
                }
            });
        } else {
            var call = `call provider_getPatientByslack('` + req.session.providerID + `','')`;
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send(results[0]);
                    return console.error(error.message);
                } else {
                    res.send(results[0]);
                }
            });
        }
    },
    //==================================================================================//

    checksluck: function (req, res) {
        var sluck = 'Patient-TestThree';
        var call2 = `call get_countpatientslack('` + sluck + `')`;
        connect.query(call2, true, function (error2, results2, fields) {
            if (error2) {
                res.send("error");
            } else {
                //res.send(results2[0][0]);
            }
        });
    },




    //++++++++++++++++++++++++++ ADD PATIENT +++++++++++++++++++++++++++++++++++++++++++++//

    addPatient: function (req, res) {

        console.log("Provider Session => " + req.session.providerID);
        //console.log("req.params.id => " + req.params.id);
        console.log(uuidv4());
        //----------------Encrypted folder creation-----------------------//
        var folderName = uuidv4();
        var dir = './public/uploads/patients/' + folderName;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        //----------------------------------------------------------------//
        var storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, dir)
            },
            filename: function (req, file, cb) {
                var datetimestamp = Date.now();
                cb(null, "patient_" + file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
            }
        });

        //res.send(req.body)
        var upload = multer({
            storage: storage,
            fileFilter: function (req, file, callback) {
                var ext = path.extname(file.originalname);
                if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
                    res.send({
                        message: "Only jpg, png, gif, jpeg are allowed."
                    });
                    return callback(null, false);
                }
                callback(null, true);
            },
        }).any();

        upload(req, res, function (err) {

            var fileName;
            var userId;
            if (req.files.length < 1) {
                fileName = "";
            } else {
                fileName = req.files[0].filename;
            }

            if (req.body.id == 0) {
                userId = "";
            } else {
                userId = req.body.id;
            }

            if (err) {
                //----------------Encrypted folder Delete if err-----------------------//
                if (fs.existsSync(dir)) {
                    if (fileName != '') {
                        var curPath = dir + "/" + fileName;
                        fs.unlinkSync(curPath);
                        fs.rmdirSync(dir);
                    } else {
                        fs.rmdirSync(dir);
                    }
                }
                //--------------------------------------------------------------------//
                res.json({
                    error_code: 1,
                    err_desc: err
                });
                return;
            } else {



                var sluck = req.body.first_name + '-' + req.body.last_name;
                var call2 = `call get_countpatientslack('` + sluck + `')`;
                connect.query(call2, true, function (error2, results2, fields) {

                    if (error2) {
                        res.send("error");

                    } else {
                        var slackcount = results2[0][0].noslack;
                        if (slackcount == 0) {
                            sluck = sluck;
                        } else {
                            slackcount = parseInt(slackcount + 1);
                            sluck = sluck + '' + slackcount;
                        }

                        console.log(req.body);
                        var call = `call admin_setPatient('` + req.body.first_name + `', '` + req.body.last_name + `', '` + req.body.email + `', '` + req.body.user_name + `','` + sluck + `', '` + req.body.phone_prefix + `', '` + req.body.phone + `', '` + req.body.password + `', '` + req.body.gender + `', '` + req.body.dob + `', '` + req.body.address + `', '` + fileName + `', '` + req.body.country + `', '` + req.body.city + `', '` + req.body.zipcode + `', '` + folderName + `','` + req.body.ssn + `', 'provider', '` + req.session.providerID + `', '` + req.body.is_active + `', '` + userId + `', @providerID, @errorMessage)`;
                        console.log(call);

                        connect.query(call, true, function (error, results, fields) {
                            if (error) {
                                //----------------Encrypted folder Delete if err-----------------------//
                                if (fs.existsSync(dir)) {
                                    if (fileName != '') {
                                        var curPath = dir + "/" + fileName;
                                        fs.unlinkSync(curPath);
                                        fs.rmdirSync(dir);
                                    } else {
                                        fs.rmdirSync(dir);
                                    }
                                }
                                //--------------------------------------------------------------------//
                                res.send("error");
                                return console.error(error.message);
                            } else {
                                var email = req.body.email;
                                let buff = new Buffer(email);
                                let base64Email = buff.toString('base64');

                                var staticemail = 'aquatechdev2@gmail.com';
                                var baseurl = configUrl.baseUrl;
                                var passwordurl = baseurl + 'patient/create-login/' + base64Email;

                                emailfunction.createLoginEmail(req.body, passwordurl);

                                res.send({
                                    status: "success"
                                });
                            }
                        });

                    }
                });



            }
        });
    },

    //+++++++++++++++++++++++++Appointment List+++++++++++++++++++++++++++++++++++++++++++++//
    getAppointmentByProvider: function (req, res) {
        if (req.session.providerID) {
            var call = `call provider_getAllAppointment('','` + req.session.providerID + `','')`;
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send(results[0]);
                    return console.error(error.message);
                } else {
                    res.send(results[0]);
                }
            });


        } else {
            res.send('error');
        }


    },


    getAppointmentDetails: function (req, res) {
        if (req.session.providerID) {
            if (req.params.id) {
                var call = `call provider_getAllAppointment('','` + req.session.providerID + `','` + req.params.id + `')`;
                connect.query(call, true, function (error, results, fields) {
                    if (error) {
                        res.send(results[0]);
                        return console.error(error.message);
                    } else {
                        res.send(results[0]);
                    }
                });
            } else {
                res.send('error');
            }
        } else {
            res.send('error');
        }

    },




    //==================================================================================//
    //+++++++++++++++++++++++++Schedule List+++++++++++++++++++++++++++++++++++++++++++++//
    getAappointmentSchedule: function (req, res) {
        if (req.params.id) {
            var call = `call patient_getAllAppointmentSchedule('` + req.params.id + `','','')`;
            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send(results[0]);
                    return console.error(error.message);
                } else {
                    res.send(results[0]);
                }
            });


        } else {
            res.send('error');
        }

    },
    //==================================================================================//

    //===================Cancel Appointment======================================//



    cancelAappointmentByProvider: function (req, res) {

        console.log(req.body);

        if (req.session.providerID) {

            if (req.body.id == 0) {
                var apid = "";
            } else {
                var apid = req.body.id;
            }
            var call = `call patient_add_appointment('` + req.body.patient_id + `','` + req.session.providerID + `','` + req.body.purpose + `','` + req.body.patient_comments + `','` + req.body.doctor_comments + `','3','` + req.body.id + `', @appointmentID, @errorMessage)`;
            console.log(call);

            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send("error");
                    return console.error(error.message);
                } else {
                    var appointmentID = results[0][0].appointmentID;
                    var schedule = req.body.date;
                    var count = schedule.length;
                    console.log('Length-' + count);
                    var flag = 0;
                    for (var i = 0; i < count; i++) {
                        //console.log(schedule[i].date);
                        //console.log(schedule[i].time);
                        var schid = '';
                        if (schedule[i].id == "") {
                            schid = '';
                        } else {
                            schid = schedule[i].id;
                        }
                        //---------Add Appointment schedule---------------------------//
                        var call2 = `call add_appointmentSchedule('` + req.body.id + `','` + schedule[i].date + `','` + schedule[i].time + `','patient','3','` + schid + `', @sheduleID, @errorMessage)`;
                        console.log(call2);
                        connect.query(call2, true, function (error2, results2, fields) {
                            if (error2) {
                                res.send("error");
                                return console.error(error.message);
                            } else {
                                flag++;
                                if (flag == count) {
                                    emailfunction.appointmentCancelEmail(req.body);
                                    res.send({
                                        status: "success"
                                    });
                                }
                            }
                        });
                        //---------------------------------------------------------------//
                    }
                }
            });
        } else {
            res.send("error");
        }
    },



    //===========================================================================//


//+++++++++++++++++++++++++Form List+++++++++++++++++++++++++++++++++++++++++++++//
    getForms: function (req, res) {

if (req.session.providerID) {
        var call = `call provider_form_assignDetails('`+req.session.providerID+`','','')`;
        connect.query(call, true, function (error, results, fields) {
            if (error) {
                res.send(results[0]);
                return console.error(error.message);
            } else {
                res.send(results[0]);
            }
        });
    }else{
        res.send('error');
    }

    },

patientgetForms: function (req, res) {

if (req.session.providerID) {
			var call1 = `call provider_getPatientByslack('','` + req.params.username + `')`;
			connect.query(call1, true, function (error1, results1, fields) {
			if (error1) {
			res.send(results1[0]);
			return console.error(error.message);
			} else{
			var patientId = results1[0][0]['id'];
			var call = `call provider_form_assignDetails('`+req.session.providerID+`','`+patientId+`','')`;
			connect.query(call, true, function (error, results, fields) {
			if (error) {
			res.send(results[0]);
			return console.error(error.message);
			} else {
			res.send(results[0]);
			}
			});
			}
			});
		}else{
		res.send('error');
	}

  },


providerAssignedForms: function (req, res) {

if (req.session.providerID) {
	if(req.params.id){
        var call = `call provider_form_assignDetails('`+req.session.providerID+`','','`+req.params.id+`')`;
        connect.query(call, true, function (error, results, fields) {
            if (error) {
                res.send(results[0]);
                return console.error(error.message);
            } else {
                res.send(results[0]);
            }
        });
        }else{
        res.send('error');
    }
    }else{
        res.send('error');
    }

    },

    //==================================================================================//



    //==========================Update Appointment==== AND Schedule new date if required=============//

    updateAappointmentByProvider: function (req, res) {

        //console.log(req.body);
        if (req.session.providerID) {

            if (req.body.id == 0) {
                var apid = "";
            } else {
                var apid = req.body.id;
            }

            var call = `call patient_add_appointment('` + req.body.patient_id + `','` + req.session.providerID + `','` + req.body.purpose + `','` + req.body.patient_comments + `','` + req.body.doctor_comments + `','` + req.body.clinic_id + `','2','` + req.body.id + `', @appointmentID, @errorMessage)`;
            console.log(call);

            connect.query(call, true, function (error, results, fields) {
                if (error) {
                    res.send("error");
                    return console.error(error.message);
                } else {
                    if (req.body.appDate == "") {
                        var schedule = req.body.date;
                        var count = schedule.length;
                        console.log('Length-' + count);
                        var flag = 0;
                        for (var i = 0; i < count; i++) {
                            var schid = '';
                            schid = schedule[i].id;
                            //---------Cancel patients Appointment schedule---------------------------//

                            var call2 = `call add_appointmentSchedule('` + req.body.id + `','` + schedule[i].date + `','` + schedule[i].time + `','patient','3','` + schid + `', @sheduleID, @errorMessage)`;
                            console.log(call2);
                            connect.query(call2, true, function (error2, results2, fields) {
                                if (error2) {
                                    res.send("error");
                                    return console.error(error.message);
                                } else {
                                    flag++;
                                    if (flag == count) {
                                        //---------------------------------------------------------------------//
                                        //---------------------Doctor add new appointment schedule for patient-------------------//

                                        var call3 = `call add_appointmentSchedule('` + req.body.id + `','` + req.body.newDate.date + `','` + req.body.newDate.time + `','provider','1','', @sheduleID, @errorMessage)`;
                                        //console.log(call2);
                                        connect.query(call3, true, function (error3, results3, fields) {
                                            if (error3) {
                                                res.send("error");
                                                return console.error(error3.message);
                                            } else {
                                                emailfunction.appointmentApprovalEmail(req.body);
                                                res.send({
                                                    status: "success"
                                                });

                                            }
                                        });
                                        //------------------------------------------------------------------------------------------//                           
                                    }
                                }
                            });
                            //---------------------------------------------------------------//
                        }

                    } else {

                        // var appointmentID = results[0][0].appointmentID;
                        var schedule = req.body.date;
                        var count = schedule.length;
                        console.log('Length-' + count);
                        var flag = 0;
                        for (var i = 0; i < count; i++) {
                            var schid = '';
                            schid = schedule[i].id;
                            var shStatus = 0;
                            if (schid == req.body.appDate) {
                                shStatus = 1;
                            } else {
                                shStatus = 3;
                            }
                            //---------update Appointment schedule---------------------------//

                            var call2 = `call add_appointmentSchedule('` + req.body.id + `','` + schedule[i].date + `','` + schedule[i].time + `','patient','` + shStatus + `','` + schid + `', @sheduleID, @errorMessage)`;
                            console.log(call2);
                            connect.query(call2, true, function (error2, results2, fields) {
                                if (error2) {
                                    res.send("error");
                                    return console.error(error.message);
                                } else {
                                    flag++;
                                    if (flag == count) {
                                        emailfunction.appointmentApprovalEmail(req.body);
                                        res.send({
                                            status: "success"
                                        });
                                    }
                                }
                            });
                            //---------------------------------------------------------------//
                        }

                    }

                }
            });
        } else {
            res.send("error");
        }

    },


    //===================================================================================//

    /*ANGULAR JS*/
    dashboard: function (req, res) {
        //req.session.providerID='87';
        res.sendFile('public/provider/main.html', {
            root: '.'
        });
    },
}
