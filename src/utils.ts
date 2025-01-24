import bcrypt from "bcrypt" 


export const shareThisHash = (len: number) => {
    let options = "asd123ASDzxc456qwePOI"
    let optLength = options.length
    let hash =""
    for(let i= 0 ; i< len ; i++){
        hash += options[Math.floor(Math.random() * optLength)]
    }
    return hash
}

export const hashMyPassword = async (clientPassword: string)=> {
    const hashedPassword = await bcrypt.hash(clientPassword, 5)
    return hashedPassword
}