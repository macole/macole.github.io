;(function($){

    //panoramaView
    jQuery.fn.angleTest=function(prmUser){

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
            var testGeometry=makeGeometry();
            group.add(testGeometry);

            scene.add(group);

            var light=new THREE.DirectionalLight(0xff0000);
            light.position.set(1,1,1).normalize();
            scene.add(light);

            runAnimate();

            function runAnimate(){
                renderer.render(scene,camera);
                requestAnimationFrame(runAnimate);
            }

            //btn_change
            $(".angle").on("change",function(){
                goRotation();
            });

            //btn_reset
            $("#btn_reset").on("click",function(){
                $("#ax").val(0);
                $("#ay").val(0);
                $("#az").val(0);

                goRotation();
            });

            //btn_pm
            var addsub=10;
            $(".btn_pm").on("click",function(){
                var type=$(this).attr("data-type");
                var target=$(this).attr("data-target");
                if(!isNaN($("#"+target).val())){
                    var wk=Number($("#"+target).val());
                    if(type=="add"){
                        wk+=addsub;
                    }else if(type=="sub"){
                        wk-=addsub;
                    }
                    $("#"+target).val(wk);
                }
                goRotation();
            });

            function goRotation(){
                if((!isNaN($("#ax").val()))&&(!isNaN($("#ay").val()))&&(!isNaN($("#az").val()))){
                    testGeometry.rotation.y=Number($("#ay").val())*Math.PI/180;
                    testGeometry.rotation.z=Number($("#az").val())*Math.PI/180;
                    testGeometry.rotation.x=Number($("#ax").val())*Math.PI/180;
                }else{
                    alert("数値を入力してください");
                }
            }
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