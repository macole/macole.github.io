;(function($){

    var ble_device;

    //micro:bit BLE UUID
    var uuid={};
    uuid["UART_SERVICE"]                 ='6e400001-b5a3-f393-e0a9-e50e24dcca9e';
    uuid["UART_SERVICE_CHARACTERISTICS"] ='6e400002-b5a3-f393-e0a9-e50e24dcca9e';

    function connect(){
        navigator.bluetooth.requestDevice({
            filters: [{
                namePrefix: 'BBC micro:bit',
            }],
            optionalServices: [uuid["UART_SERVICE"]]
        })
        .then(device => {
            uart_device=device;
            return device.gatt.connect();
        })
        .then(server => {
            return server.getPrimaryService(uuid["UART_SERVICE"]);
        })
        .then(service => {
            return service.getCharacteristic(uuid["UART_SERVICE_CHARACTERISTICS"]);
        })
        .then(chara => {
            alert("BLE connected");
            characteristic=chara;
            characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged',onCharacteristicValueChanged);
        })
        .catch(error => {
            alert("BLE error");
        });
    }

    var boxGeometry;
    function onCharacteristicValueChanged(e){
        var str_arr=[];
        for(var i=0;i<this.value.byteLength;i++){
            str_arr[i]=this.value.getUint8(i);
        }
        var str=String.fromCharCode.apply(null,str_arr);

        var pr=str.split(",",2);
        $("#pitch").val(pr[0]);
        $("#roll").val(pr[1]);

        boxGeometry.rotation.z=Number(pr[1])*Math.PI/180;
        boxGeometry.rotation.x=Number(pr[0])*Math.PI/180;
    }

    function disconnect(){
        if((!accelerometer_device)||(!accelerometer_device.gatt.connected)){
            return;
        }else{
            accelerometer_device.gatt.disconnect();
            alert("BLE disconnected");
        }
    }

    //panoramaView
    jQuery.fn.bleTest=function(prmUser){

        ///////////////////////////////////////////////////////////////////////////////////////////
        // Var
        ///////////////////////////////////////////////////////////////////////////////////////////

        //parameter
        const prmDef={
            camera : {
                fov  : 45,
                near : 1,
                far  : 2000
            }
        };
        const prm=$.extend(prmDef,prmUser);

        //canvas
        const myCanvas=$(this);
        var cv=new Canvas();
        function Canvas(){
            this._id     =myCanvas.attr("id");
            this._box    =myCanvas.closest(".canvas_box");
            this._w      =this._box.width();
            this._h      =this._box.height();
        }
        myCanvas.attr({
            'width'  : cv._w,
            'height' : cv._h
        });

        //three.js
        var renderer;
        var scene;
        var group;
        var camera;


        ///////////////////////////////////////////////////////////////////////////////////////////
        // Canvas
        ///////////////////////////////////////////////////////////////////////////////////////////

        setCanvas();
        function setCanvas(){
            if(!Detector.webgl){Detector.addGetWebGLMessage();}

            renderer=new THREE.WebGLRenderer({
                canvas    : document.querySelector('#'+cv._id),
                antialias : true,
                alpha     : true
            });

            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(cv._w,cv._h);

            scene=new THREE.Scene();
            group=new THREE.Group();

            camera=new THREE.PerspectiveCamera(prm.camera.fov,cv._w/cv._h,prm.camera.near,prm.camera.far);
            camera.position.set(0,200,200);
            camera.lookAt(new THREE.Vector3(0,0,0));

            //Helper
            group.add(new THREE.GridHelper(500,10));
            group.add(new THREE.AxisHelper(1000));

            //Geometry
            boxGeometry=makeGeometry();
            group.add(boxGeometry);

            scene.add(group);
            runAnimate();

            function runAnimate(){
                renderer.render(scene,camera);
                requestAnimationFrame(runAnimate);
            }

            //btn_connect
            $("#btn_connect").on("click",function(){
                connect();
            });

            //btn_disconnect
            $("#btn_disconnect").on("click",function(){
                disconnect();
            });
        }

        ///////////////////////////////////////////////////////////////////////////////////////////
        // Window Resize
        ///////////////////////////////////////////////////////////////////////////////////////////

        var timerResize=false;
        $(window).on("resize",function(){
            if(timerResize!==false){
                clearTimeout(timerResize);
            }
            timerResize=setTimeout(function(){
                resizeCanvas();
            },500);
        });

        function resizeCanvas(){
            cv._w=cv._box.width();
            cv._h=cv._box.height();
            myCanvas.attr({
                'width'  : cv._w,
                'height' : cv._h
            });

            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(cv._w,cv._h);
            camera.aspect=cv._w/cv._h;
            camera.updateProjectionMatrix();
        }

    };

    function makeGeometry(){
        var group=new THREE.Group();

        var texture1=new THREE.TextureLoader().load("src/white.jpg");
        texture1.minFilter=texture1.magFilter=THREE.LinearFilter;
        texture1.mapping=THREE.UVMapping;
        var texture2=new THREE.TextureLoader().load("src/white.jpg");
        texture2.minFilter=texture2.magFilter=THREE.LinearFilter;
        texture2.mapping=THREE.UVMapping;
        var texture3=new THREE.TextureLoader().load("src/front.jpg");
        texture3.minFilter=texture3.magFilter=THREE.LinearFilter;
        texture3.mapping=THREE.UVMapping;
        var texture4=new THREE.TextureLoader().load("src/back.jpg");
        texture4.minFilter=texture4.magFilter=THREE.LinearFilter;
        texture4.mapping=THREE.UVMapping;
        var texture5=new THREE.TextureLoader().load("src/side.jpg");
        texture5.minFilter=texture5.magFilter=THREE.LinearFilter;
        texture5.mapping=THREE.UVMapping;
        var texture6=new THREE.TextureLoader().load("src/side.jpg");
        texture6.minFilter=texture6.magFilter=THREE.LinearFilter;
        texture6.mapping=THREE.UVMapping;

        var material1=new THREE.MeshBasicMaterial({map: texture1});
        var material2=new THREE.MeshBasicMaterial({map: texture2});
        var material3=new THREE.MeshBasicMaterial({map: texture3});
        var material4=new THREE.MeshBasicMaterial({map: texture4});
        var material5=new THREE.MeshBasicMaterial({map: texture5});
        var material6=new THREE.MeshBasicMaterial({map: texture6});
        var materials=new THREE.MultiMaterial([material1,material2,material3,material4,material5,material6]);

        var testGeometry=new THREE.BoxGeometry(100,31,227);
        var testMesh=new THREE.Mesh(testGeometry,materials);
        testMesh.position.set(0,0,0);
        group.add(testMesh);

        return group;
    }

})(jQuery);