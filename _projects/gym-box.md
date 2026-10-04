---
title: Gym Box
order: 1
discipline: Service design, UX
summary: Private, fully equipped workout pods that people find, book and unlock with their phone.
context: Team project, Service Design course.
card: /assets/images/work/gym-hero.jpg
card_alt: Glass-walled private gym pods on a city plaza at dusk
card_alt_img: /assets/images/work/gym-app.jpg
peek: App flow
hero: /assets/images/work/gym-hero.jpg
hero_alt: Rendering of private gym pods in a city plaza at dusk
lead: A service for people stuck between a crowded gym and a cramped living room. Gym Box offers private, fully equipped pods that you find, book and unlock with your phone.
facts:
  - label: Type
    value: Service design and UX
  - label: Team
    value: Two designers
  - label: Context
    value: Project 6, Service Design, Pars University of Art and Architecture
  - label: Methods
    value: Pain-point research, service journey, service blueprint, app flow
journey:
  - title: Open the app
    text: See the pods around you.
    shot: /assets/images/work/gym-screen-find.jpg
    screen: true
    stage: Search and book
  - title: Check live availability
    text: A real-time map shows which pods are free.
    shot: /assets/images/work/gym-screen-find.jpg
    screen: true
    stage: Search and book
  - title: Book a session
    text: 45 or 60 minutes, in a few taps.
    shot: /assets/images/work/gym-screen-book.jpg
    screen: true
    stage: Search and book
  - title: Unlock with your phone
    text: A single-use QR code opens the door.
    shot: /assets/images/work/gym-screen-code.jpg
    screen: true
    stage: Access
  - title: Train in private
    text: Video guidance plays on the screen in the pod.
    shot: /assets/images/work/gym-interior.jpg
    stage: Training
  - title: Leave
    text: UV-C cleaning runs before the next booking.
    shot: /assets/images/work/gym-hero.jpg
    stage: Exit
blueprint:
  - stage: Search and book
    action: Checks availability and books a slot
    touchpoint: Mobile app
    backstage: Scheduling database and live capacity map
  - stage: Access
    action: Enters the pod with a code
    touchpoint: Smart door
    backstage: Code verification
  - stage: Training
    action: Chooses a video and trains
    touchpoint: Screen in the pod
    backstage: Video streaming from partner trainers
  - stage: Exit
    action: Finishes and leaves
    touchpoint: Exit door
    backstage: Automatic UV-C cleaning
print:
  notes:
    - title: The problem
      text: "At home there is no equipment and little space. Public gyms mean crowds, queues for machines, no privacy and fixed hours. Both end in lost motivation, and often in quitting."
    - title: What gets in the way
      text: "- **Operational:** waiting for machines, time lost travelling, no way to see how busy the gym is.\n- **Psychological:** fear of judgement, distraction, privacy and hygiene worries, fear of doing exercises wrong."
  heading: The service and what runs behind it
  intro: "A workout becomes a short, private booking. Each step the user sees is backed by a system they don't: bookings, door access, video content and cleaning."
  images:
    - src: /assets/images/work/gym-app.jpg
      caption: "App flow: find a pod, pick a time, get a door code."
    - src: /assets/images/work/gym-interior.jpg
      caption: "Inside the pod: compact equipment and a training screen."
    - src: /assets/images/work/gym-pod.jpg
      caption: "A single pod: acoustic shell, premium equipment."
---

<div class="chapter">
<h2>The problem</h2>
<div class="body" markdown="1">
People who want to train seriously are stuck between two poor options. At home there is no equipment and little space. In public gyms there are crowds, queues for machines, no privacy, and opening hours that rarely fit the day. Both end in lost motivation, and often in quitting.
</div>
</div>

<div class="chapter">
<h2>What gets in the way</h2>
<div class="body" markdown="1">
- **Operational:** waiting for busy machines at peak hours, time lost travelling and queueing, and no way to know how busy the gym is before going.
- **Psychological:** fear of being judged, distraction from noise and crowds, privacy and hygiene worries, comparing yourself with others, and fear of doing an exercise wrong.
</div>
</div>

<div class="chapter">
<h2>The service journey</h2>
<div class="body" markdown="1">
A workout becomes a short, private booking.
</div>
</div>

{% include journey.html %}

<div class="gallery">
{% include fig.html src="/assets/images/work/gym-app.jpg" alt="Three app screens: find a pod on a map, choose a time, booking confirmed with a QR code" caption="App flow: find a pod nearby, choose a time slot, get a single-use code for the door." ratio="1269 / 753" %}
{% include fig.html src="/assets/images/work/gym-interior.jpg" alt="Rendering of a person training inside a private pod with a video screen" caption="Inside the pod: compact equipment and a screen that streams training videos." ratio="1269 / 753" %}
</div>

<div class="chapter">
<h2>Service blueprint</h2>
<div class="body" markdown="1">
Each step the user sees is backed by a system they don't: bookings, door access, video content and cleaning. A maintenance team and partner trainers keep the pods and the videos up to date.
</div>
</div>

{% include blueprint.html rows=page.blueprint %}

<div class="gallery">
{% include fig.html src="/assets/images/work/gym-pod.jpg" alt="Poster of a single private gym pod" caption="A single pod: acoustic shell, premium equipment, flexible booking." ratio="1 / 1" %}
{% include fig.html src="/assets/images/work/gym-hero.jpg" alt="Pods in a city plaza at dusk" caption="Pods placed where people already pass by." ratio="1 / 1" cover=true %}
</div>
