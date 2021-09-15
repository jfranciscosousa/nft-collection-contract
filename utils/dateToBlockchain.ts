export default function dateToBlockchain(date: Date){
  return Math.floor(date.getTime() / 1000);
}
