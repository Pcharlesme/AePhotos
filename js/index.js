let client=null;
let contractInstance=null;
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
    Ae.Aepp().then(function(result){
        console.log("new client",result);
        client=result;
    }).catch(function(error){
        console.error("error",error);
    });
})


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
        addImageToDom(reader.result,imageName);
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