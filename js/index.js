

let client=null;
let contractInstance=null;
let ipfs=null;
let contractAddress='ct_2qzbFfdc1UiKJhi8oXLnXk14HkE6CRtPtsjgiQkRVZGTT4jNSY';
let contractSource=`
contract AePhotos=

    record photoInfo={
        name:string,
        ipfsHash:string
     }
    
    record state={
        allPhotos:map(address,list(photoInfo))        
     }
    
    stateful entrypoint init()={allPhotos={}}

    stateful entrypoint addPhoto(name':string, ipfsHash':string)=
        let photoList=Map.lookup_default(Call.caller,state.allPhotos,[])
        let newPhoto={name=name',ipfsHash=ipfsHash'}
        let newPhotosList=newPhoto::photoList
        put(state{allPhotos[Call.caller]=newPhotosList})

    entrypoint getAllPhotos()=
        Map.lookup_default(Call.caller,state.allPhotos,[])
`;

window.addEventListener('load',function(){

     ipfs=new IPFS({host:'ipfs.infura.io',port:5001,protocol:'https'});
   console.log(ipfs);
    Ae.Aepp().then(function(result){
        console.log("new client",result);
        client=result;
    client.getContractInstance(contractSource,{contractAddress}).then(function(result){
            console.log("contract instance",result);
            contractInstance=result;
        contractInstance.methods.getAllPhotos().then(function(res){
                res.map(function(photoInfo){
                    axios.get(`https://ipfs.io/ipfs/${photoInfo.ipfsHash}`).then(function(result){
                        console.log("image data",result.data);
                      addImageToDom(result.data,photoInfo.name);  
                    }).catch(function(error){
                        console.error(error);
                    });
                });
        }).catch(function(err){
            console.error(err);
        })
    }).catch(function(error){
        console.error(error);
    })
    }).catch(function(error){
        console.error("error",error);
    });
});


document.getElementById("submit").addEventListener("click", handleSubmitButton);
let picture=null;
async function handleSubmitButton(){
   let imageName= document.getElementById("pic-name").value;
    if(imageName===""||picture===null){
        console.log("Both fields are compulsory");
        return;
    }
   console.log(imageName,picture);
   sendDataToAeNode(picture,imageName);
}

async function sendDataToAeNode(picture,imageName){
    let reader= new FileReader();
    reader.onloadend= async function(){
        console.log(reader.result);

        ipfs.add(reader.result,function(err,res){
            if(err){
                console.error(err);
                return;
            }
            console.log(res);
            contractInstance.methods.addPhoto(imageName,res).then(function(result){
                axios.get(`https://ipfs.io/ipfs/${res}`).then(function(result){
                    addImageToDom(result.data,imageName);
                }).catch(function(error){
                    console.error(err);
                })

            }).catch(function(err){console.error(err)})

        });
        
    }

    reader.readAsDataURL(picture);
}



function addImageToDom(imageSrc,imageName){
    let allImages=document.getElementById("all-images");
    let imageDiv=document.createElement("div");
    imageDiv.classList.add("image");

    let image=document.createElement("img");
    image.src=imageSrc;

    let paragraph=document.createElement("p");
    paragraph.innerText=imageName;

    imageDiv.appendChild(image);
    imageDiv.appendChild(paragraph);
    allImages.appendChild(imageDiv);


}


document.getElementById("my-inp").addEventListener("change",function(event){
    picture=event.currentTarget.files[0];
    console.log(picture);


})