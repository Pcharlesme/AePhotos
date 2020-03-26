let client = null, contractInstance = null, ipfs = null, photo = null;
let contractAddress='ct_3bHLqnmezW6efQkypQDvYti31vCGEGf92ALpJtgTd4xCTyCAS';
let contractSource=`
contract AePhotos=

  record photo =
    { name:string,
      imageHash:string,
      timestamp:int }
  
  record state={allPhotos:map(address,list(photo))}
  
  stateful entrypoint init()={allPhotos={}}

  stateful entrypoint addPhoto(name':string, imageHash':string)=
    let newPhoto={name=name',imageHash=imageHash',timestamp=Chain.timestamp}
    let newPhotosList=newPhoto::getPhotos()
    put(state{allPhotos[Call.caller]=newPhotosList})

  entrypoint getPhotos()=
    Map.lookup_default(Call.caller,state.allPhotos,[])
`;

window.addEventListener('load',function(){
  ipfs = new IPFS({host:'ipfs.infura.io', port:5001, protocol:'https'});
  Ae.Aepp().then(function(clientResult) {
    client = clientResult;

    client.getContractInstance(contractSource,{contractAddress}).then(function(InstanceResult){
      contractInstance = InstanceResult;

      contractInstance.methods.getPhotos()
      .then(function(photos) {
        if(photos.decodedResult.length == 0) {
          document.getElementById("loader").style.display = "none";
          document.getElementById("all-photos").innerHTML = "<p class='text-danger text-center'>You don't have image saved on æternity blockchain. Use the form above to save one now!!!</p>"
        }
        photos.decodedResult.map(function(photo) {
          axios.get(`https://ipfs.io/ipfs/${photo.imageHash}`).then(function(result) {
            addImageToDom(result.data,photo.name);  
            document.getElementById("loader").style.display = "none";
          }).catch(function(error){
            console.error(error);
          });
        });      
      })
      .catch(function(err) {
        console.error(err);
      })
    }).catch(function(error) {
      console.error(error);
    })
  }).catch(function(error){
    console.error(error);
  });
});

document.getElementById("select-photo").addEventListener("change", function(event) {
  photo = event.currentTarget.files[0];
})

document.getElementById("submit-photo").addEventListener("click", handleSubmitButton);
async function handleSubmitButton(event) {
  event.preventDefault();
  let imageName = document.getElementById("pic-name").value;

  document.getElementById("loader").style.display = "block";
  sendDataToAeNode(photo,imageName); 
}

async function sendDataToAeNode(photo,imageName) {
  let reader = new FileReader();

  reader.onloadend = async function() {
    ipfs.add(reader.result, function(err, res) {
      if(err) {
        console.error(err);
        return;
      }
      contractInstance.methods.addPhoto(imageName, res)
        .then(function() {
          axios.get(`https://ipfs.io/ipfs/${res}`).then(function(result){
            addImageToDom(result.data, imageName);
            document.getElementById("loader").style.display = "none";
          }).catch(function(error){
            console.error(error);
          })
        })
        .catch(function(err){console.error(err)})
    });
  }

  reader.readAsDataURL(photo);
}

function addImageToDom(imageSrc, imageName){
  let allImages=document.getElementById("all-photos");
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