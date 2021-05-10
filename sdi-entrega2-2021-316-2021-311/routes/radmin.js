module.exports = function(app,swig,gestorBD) {

    app.get("/admin/users", function(req, res) {
        //Busca en la base de datos todos los usuarios diferentes al usuario administrador
        let criterio = {rol:{$ne: 'admin'}}
        gestorBD.obtenerUsuarios(criterio, function( allUsers ) {
            if (allUsers == null) {
                res.redirect("/");
            } else {
                let respuesta = swig.renderFile('views/badmin.html',
                    {
                        users : allUsers,
                        user: req.session.usuario
                    });
                res.send(respuesta);
            }
        });
    });
    app.post("/admin/users/delete", function(req, res) {


        let users=req.body.checkboxUser;
        let emails = []
        if(Array.isArray(users)){
            for(let i=0;i<users.length;i++) {
                emails.push(users[i]);
            }
            //Borra todos los usuarios de la lista recursivamente
            recursiveDelete(res,emails);
        }
        else if(users!==undefined){
            //Borra el usaurio dado de la base de datos con su informacion relacionada
            emails.push(users);
            recursiveDelete(res,emails);
        }
    });

    function recursiveDelete(res,listaDeEmails){
        if(listaDeEmails.size() === 0){
            res.redirect("/admin/users");
        }else{
            //Elimina el usuario de la base de datos
            let criterio = {"email" : listaDeEmails[0] };
            gestorBD.eliminarUsuario(criterio, function( user ) {

                if ( user == null ){
                    res.redirect("/admin/users?tipoMensaje=alert-danger&mensaje=Error al borrar usuarios");
                }else{
                    criterio = {vendedor:listaDeEmails[0],
                                comprada: null}
                    //Elimina las ofertas del usuario  que no esten comprada
                    gestorBD.eliminarOferta(criterio,function (oferta){
                       if(oferta == null){
                           res.redirect("/admin/users?tipoMensaje=alert-danger&mensaje=Error al borrar las ofertas del usuario");
                       }else{
                           criterio = {emailInteresado: listaDeEmails[0]}
                           //Elimina las conversaciones donde el usaurio es el interesado
                           gestorBD.eliminarConversaciones(criterio,function (conversacion) {
                               if(conversacion===null){
                                   res.redirect("/admin/users?tipoMensaje=alert-danger&mensaje=Error al borrar las conversaciones del usuario");
                               }else{
                                   criterio = {emailPropietario: listaDeEmails[0]}
                                   //Elimina las conversaciones donde el usaurio es el propietario
                                   gestorBD.eliminarConversaciones(criterio,function (conversacion) {
                                       if(conversacion===null){
                                           res.redirect("/admin/users?tipoMensaje=alert-danger&mensaje=Error al borrar las conversaciones del usuario");
                                       }else{
                                           recursiveDelete(listaDeEmails.pop());
                                       }
                                   });
                               }
                           });
                       }
                    });
                }

            });
        }
    }

};