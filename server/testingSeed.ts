// scripts/seedWatched.ts
import knex from './src/db/knex';
// const knex = require('./src/db/knex.ts');

async function seed() {
  await knex('watched_addresses').insert({address: '9HCTuTPEiQvkUtLmTZvK6uch4E3pDynwJTbNw6jLhp9z', username: 'solana_whale', profile_picture_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnWlX_HB0i3w5xtC1PRT-MNCZij_rnBkVzpw&s'}).onConflict('address').ignore();
  await knex('watched_addresses').insert({ address: '6kbwsSY4hL6WVadLRLnWV2irkMN2AvFZVAS8McKJmAtJ', username: 'DNBCHDHSJJDII', profile_picture_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSD-W-KYzqP3m3HPoALfwLMdpmL7mrKMR_jfg&s' }).onConflict('address').ignore();
  await knex('watched_addresses').insert({ address: 'DYAn4XpAkN5mhiXkRB7dGq4Jadnx6XYgu8L5b3WGhbrt', username: 'JACKEY_2019', profile_picture_url: 'https://imgcdn.stablediffusionweb.com/2025/8/22/9a0f0a08-f57d-4c60-9fbf-5e1258a23e85.jpg' }).onConflict('address').ignore();
  await knex('watched_addresses').insert({ address: 'BTf4A2exGK9BCVDNzy65b9dUzXgMqB4weVkvTMFQsadd', username: 'DEFI_TRADER', profile_picture_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRggpvzPhrSRv_Tn96Y-w9bnTCPxCxh_KF-eA&s' }).onConflict('address').ignore();
  await knex('watched_addresses').insert({ address: 'GJA1HEbxGnqBhBifH9uQauzXSB53to5rhDrzmKxhSU65', username: 'NFT_COLLECTOR', profile_picture_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSXizA99_V89N6rVFzeHVjEL99XL8wbNOjPw&s' }).onConflict('address').ignore();
  await knex('watched_addresses').insert({ address: 'Fu1CTFUqmtr8NwajtFPC1HLWfKtKzr9dSbcvsyaJZXtu', username: 'MEME_KING', profile_picture_url: 'https://i1.sndcdn.com/artworks-aTPXBlwdHkhw5CVz-zDKPEw-t500x500.jpg' }).onConflict('address').ignore();

  // ... more
  process.exit(0);
}

async function decodeMetadata(uri: string) {
  try {
    let url = uri;
    console.log("uri: ", url);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.statusText}`);
    const data = await res.json();

    return {
      name: data.name,
      symbol: data.symbol,
      image: data.image,
      description: data.description,
    };
  } catch (err) {
    console.error("Error decoding metadata:", err);
    return null;
  }
}
decodeMetadata('https://ipfs.io/ipfs/bafkreiezsj5kawmykf2oqzf75tauzbm4zcrl5gp35bwjfkc4xxaxotmyyu');
// seed();