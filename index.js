// === class declarations
/**
 * @typedef Party
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {Date} date
 * @property {string} location
 * @property {boolean} selected
 */

class Party {
  constructor(id, name, description, date, location) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.date = date;
    this.location = location;
    this.selected = false;
  }
}

/**
 * @typedef RSVP
 * @property {number} id
 * @property {number} guestId
 * @property {number} eventID
 */

class RSVP {
  constructor(id, guestId, eventID) {
    this.id = id;
    this.guestId = guestId;
    this.eventID = eventID;
  }
}

/**
 * @typedef Guest
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} bio
 * @property {string} job
 */

class Guest {
  constructor(id, name, email, phone, bio, job) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.bio = bio;
    this.job = job;
  }
}

// === Constants ===
const BASE = "https://fsa-crud-2aa9294fe819.herokuapp.com/api";
const COHORT = "/2605-ftb-et-ft";

const PARTY_RESOURCE = "/events";
const PARTY_API = BASE + COHORT + PARTY_RESOURCE;

const RSVP_RESOURCE = "/rsvps";
const RSVP_API = BASE + COHORT + RSVP_RESOURCE;

const GUEST_RESOURCE = "/guests";
const GUEST_API = BASE + COHORT + GUEST_RESOURCE;

// === State ===
/** @type {Party[]} */
let parties = [];
/** @type {Party} */
let selectedParty;
/** @type {Map<number, Guest[]>} */
let guests = new Map();

/** Updates state with all parties from the API */
async function getParties() {
  try {
    const response = await fetch(PARTY_API);
    const partiesData = await response.json();
    for (const party of partiesData.data) {
      parties.push(
        new Party(
          party.id,
          party.name,
          party.description,
          new Date(party.date),
          party.location,
        ),
      );
    }
  } catch (error) {
    console.log("Failed to fetch parties:", error);
  }
}

/**
 * Updates state with a single party from the API
 * @param {number} id
 */
async function getParty(partyId) {
  try {
    const response = await fetch(`${PARTY_API}/${partyId}`);
    const partyData = await response.json();
    const newParty = partyData.data;
    selectedParty = new Party(
      newParty.id,
      newParty.name,
      newParty.description,
      new Date(newParty.date),
      newParty.location,
    );
  } catch (error) {
    console.log("Failed to fetch party:", error);
  }
}

async function getRSVPs(eventId) {
  try {
    const rsvps = [];

    const response = await fetch(RSVP_API);
    const rsvpsData = await response.json();
    for (const rsvp of rsvpsData.data) {
      const newRSVP = new RSVP(rsvp.id, rsvp.guestId, rsvp.eventId);
      if (newRSVP.eventID === eventId) rsvps.push(newRSVP);
    }
    //console.log(rsvps);

    return rsvps;
  } catch (error) {
    console.log("Failed to fetch RSVPs:", error);
    return null;
  }
}

async function getGuests(eventId) {
  try {
    const rsvps = await getRSVPs(eventId);
    const guestsArr = [];
    for (const rsvp of rsvps) {
      const newGuest = await getGuest(rsvp.guestId);
      guestsArr.push(newGuest);
    }
    guests.set(eventId, guestsArr);
  } catch (error) {
    console.log("Failed to fetch guests:", error);
  }
}

async function getGuest(guestId) {
  try {
    const response = await fetch(`${GUEST_API}/${guestId}`);
    const guestData = await response.json();
    const newGuestData = guestData.data;
    const newGuest = new Guest(
      guestData.data.id,
      guestData.data.name,
      guestData.data.email,
      guestData.data.phone,
      guestData.data.bio,
      guestData.data.job,
    );
    return newGuest;
  } catch (error) {
    console.log("failed to fetch guest:", error);
  }
}

// === Components ===

/**
 * Party name that shows more details about the party when clicked
 * @param {Party} party
 */
function PartyListItem(party) {
  const $li = document.createElement("li");
  const $a = $li.children;
  $li.innerHTML = `
    <a href="#selected">${party.name}</a>
  `;

  $li.addEventListener("click", async (event) => {
    for (let i = 0; i < parties.length; i++) {
      parties[i].selected = false;
    }
    party.selected = true;
    await getParty(party.id);
    if (!guests.has(party.id)) {
      await getGuests(party.id);
    }
    render();
  });

  if (party.selected) $li.classList.add("selectedParty");

  return $li;
}

/** A list of names of all parties */
function PartyList() {
  const $ul = document.createElement("ul");
  $ul.classList.add("partyList");
  const liArr = parties.map(PartyListItem);
  $ul.replaceChildren(...liArr);
  return $ul;
}

/** Detailed information about the selected party */
function PartyDetails() {
  if (!selectedParty) {
    const $p = document.createElement("p");
    $p.textContent = "Please select a party to learn more.";
    return $p;
  }

  const $section = document.createElement("section");
  $section.classList.add("party");
  $section.innerHTML = `
    <h3>${selectedParty.name} #${selectedParty.id}</h3>
    <div>
      <p>${selectedParty.date.toLocaleString()}</p>
      <p>${selectedParty.location}</p>
    </div>
    <p>${selectedParty.description}</p>
  `;
  return $section;
}

function GuestList() {
  if (!selectedParty) {
    const $p = document.createElement("p");
    return $p;
  }

  const $ul = document.createElement("ul");
  $ul.classList.add("guests");
  const guestList = guests.get(selectedParty.id);
  const liArr = guestList.map(GuestListItem);
  $ul.replaceChildren(...liArr);
  return $ul;
}

function GuestListItem(guest) {
  const $li = document.createElement("li");
  $li.innerHTML = `
    ${guest.name}
  `;
  return $li;
}

// === Render ===
function render() {
  const $app = document.querySelector("#app");
  $app.innerHTML = `
    <h1>Party Planner</h1>
    <main>
      <section>
        <h2>Upcoming Parties</h2>
        <PartyList></PartyList>
      </section>
      <section id="selected">
        <h2>Party Details</h2>
        <PartyDetails></PartyDetails>
        <GuestList></GuestList>
      </section>
    </main>
  `;
  $app.querySelector("PartyList").replaceWith(PartyList());
  $app.querySelector("PartyDetails").replaceWith(PartyDetails());
  $app.querySelector("GuestList").replaceWith(GuestList());
}

async function init() {
  await getParties();
  render();
}

init();
