<script setup lang="ts">
import { computed, ref } from 'vue';
import BeamScene from './components/BeamScene.vue';
import type { BeamInputs, Calculation } from '../shared/calculation';

const inputs = ref<BeamInputs>({ length: 6, width: 0.1, height: 0.3, strength: 20000 });
const result = ref<Calculation | null>(null);
const history = ref<Calculation[]>([]);
const email = ref('');
const licenseKey = ref('');
const licensed = ref(false);
const licenseMessage = ref('');
const licenseBusy = ref(false);
const busy = ref(false);
const error = ref('');

const formattedCapacity = computed(() => result.value
  ? new Intl.NumberFormat('lv-LV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(result.value.capacity)
  : '—');

async function loadHistory(): Promise<void> {
  history.value = await window.beamApp.getHistory();
}

async function verifyLicense(): Promise<void> {
  licenseBusy.value = true;
  licenseMessage.value = '';
  try {
    const response = await window.beamApp.verifyLicense({ email: email.value, licenseKey: licenseKey.value });
    licenseMessage.value = response.message;
    licensed.value = response.valid;
    if (response.valid) await loadHistory();
  } finally {
    licenseBusy.value = false;
  }
}

async function calculate(): Promise<void> {
  error.value = '';
  busy.value = true;
  try {
    result.value = await window.beamApp.calculateAndSave({ ...inputs.value });
    await loadHistory();
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Aprēķinu neizdevās veikt.';
  } finally {
    busy.value = false;
  }
}

function useCalculation(item: Calculation): void {
  inputs.value = {
    length: item.length,
    width: item.width,
    height: item.height,
    strength: item.strength
  };
  result.value = item;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('lv-LV', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

</script>

<template>
  <main v-if="!licensed" class="license-page">
    <section class="license-card">
      <div class="brand-mark">K<span>·</span>S</div>
      <p class="eyebrow">KOKA SIJAS RĪKS</p>
      <h1>Laipni lūdzam</h1>
      <p class="license-intro">Lai atvērtu aprēķinu darbvietu, pārbaudiet savu izstrādes licenci.</p>
      <form class="license-form" @submit.prevent="verifyLicense">
        <label>E-pasta adrese
          <input v-model="email" type="email" autocomplete="email" placeholder="vards@piemers.lv" required />
        </label>
        <label>Licences atslēga
          <input v-model="licenseKey" type="password" autocomplete="off" placeholder="Ievadiet licences atslēgu" required />
        </label>
        <button class="primary-button license-submit" :disabled="licenseBusy">
          {{ licenseBusy ? 'Pārbauda…' : 'Pārbaudīt licenci' }} <span aria-hidden="true">→</span>
        </button>
      </form>
      <p v-if="licenseMessage" class="feedback" :class="{ 'feedback-error': !licensed }">{{ licenseMessage }}</p>
      <div class="prototype-note">
        <span class="note-icon">i</span>
        <p><strong>Vietējais izstrādes prototips</strong><br />Licenču API darbojas lokāli. Šis nav produkcijas licencēšanas vai identitātes risinājums.</p>
      </div>
      <p class="license-help">Palaidiet lokālo API un izveidojiet testa licenci, izmantojot <code>npm run license:api</code> un <code>npm run license:issue -- epasts</code>.</p>
    </section>
  </main>

  <main v-else class="app-shell">
    <header class="topbar">
      <a class="wordmark" href="#" aria-label="Koka sijas kalkulators sākums"><span class="brand-mark small">K<span>·</span>S</span><span>Koka sijas<br /><b>kalkulators</b></span></a>
      <div class="topbar-right"><span class="saved-indicator"><i></i> Saglabā lokāli</span><span class="avatar">KS</span></div>
    </header>

    <div class="workspace">
      <section class="welcome-row">
        <div><p class="eyebrow">APRĒĶINU DARBVIETA</p><h1>Sijas slodzes kapacitāte</h1><p class="subtitle">Novērtējiet vienmērīgi sadalīto slodzi vienkārši balstītai koka sijai.</p></div>
        <span class="prototype-pill">Izstrādes prototips</span>
      </section>

      <div class="dashboard-grid">
        <section class="panel input-panel">
          <div class="section-heading"><span class="step-number">01</span><div><h2>Sijas parametri</h2><p>Ievadiet materiāla un ģeometrijas vērtības</p></div></div>
          <form class="input-form" @submit.prevent="calculate">
            <label class="field"><span> laidums <small>L</small></span><div class="input-wrap"><input v-model.number="inputs.length" type="number" min="0.000001" step="any" required /><span>m</span></div></label>
            <label class="field"><span>Platums <small>B</small></span><div class="input-wrap"><input v-model.number="inputs.width" type="number" min="0.000001" step="any" required /><span>m</span></div></label>
            <label class="field"><span>Augstums <small>H</small></span><div class="input-wrap"><input v-model.number="inputs.height" type="number" min="0.000001" step="any" required /><span>m</span></div></label>
            <label class="field"><span>Lieces stiprība <small>f</small></span><div class="input-wrap"><input v-model.number="inputs.strength" type="number" min="0.000001" step="any" required /><span>kPa</span></div></label>
            <button class="primary-button calculate-button" type="submit" :disabled="busy">{{ busy ? 'Aprēķina…' : 'Aprēķināt kapacitāti' }} <span aria-hidden="true">→</span></button>
            <p v-if="error" class="error-message" role="alert">{{ error }}</p>
          </form>
          <div class="formula-card"><span class="formula-label">APRĒĶINA FORMULA</span><div class="formula">W = <i>BH</i><sup>2</sup>/6 <span class="formula-separator">·</span> q = 8<i>fW</i>/<i>L</i><sup>2</sup></div><p>Rezultāts q tiek izteikts kN/m</p></div>
        </section>

        <section class="panel visualization-panel">
          <div class="section-heading"><span class="step-number">02</span><div><h2>Sijas vizualizācija</h2><p>Modelis pielāgojas šķērsgriezuma izmēriem</p></div></div>
          <BeamScene :length="inputs.length" :width="inputs.width" :height="inputs.height" />
          <div class="dimension-row"><span><i class="dimension-line"></i> L = {{ inputs.length }} m</span><span>B × H = {{ inputs.width }} × {{ inputs.height }} m</span></div>
        </section>

        <section class="result-card">
          <div class="result-topline"><span class="result-icon">↗</span><span>APRĒĶINĀTĀ KAPACITĀTE</span></div>
          <div class="result-main"><strong>{{ formattedCapacity }}</strong><span>kN/m</span></div>
          <p>Vienmērīgi sadalītā slodze pēc lieces stiprības</p>
          <div class="result-divider"></div>
          <div class="result-meta"><span>Šķērsgriezuma pretestības moments <b>W</b></span><strong>{{ result ? result.sectionModulus.toPrecision(4) : '—' }} m³</strong></div>
        </section>
      </div>

      <section class="history-section">
        <div class="history-heading"><div><p class="eyebrow">JŪSU DARBĪBA</p><h2>Aprēķinu vēsture</h2></div><span class="history-count">{{ history.length }} ieraksti</span></div>
        <div v-if="history.length" class="history-table-wrap">
          <table><thead><tr><th>Datums</th><th>Laidums L</th><th>Šķērsgriezums B × H</th><th>Stiprība f</th><th>Kapacitāte q</th><th></th></tr></thead>
            <tbody><tr v-for="item in history" :key="item.id"><td>{{ formatDate(item.createdAt) }}</td><td>{{ item.length }} m</td><td>{{ item.width }} × {{ item.height }} m</td><td>{{ item.strength }} kPa</td><td><strong>{{ item.capacity.toFixed(2) }} kN/m</strong></td><td><button class="text-button" @click="useCalculation(item)">Ielādēt</button></td></tr></tbody>
          </table>
        </div>
        <div v-else class="empty-history"><span>↳</span><p>Vēl nav saglabātu aprēķinu. Pirmais aprēķins tiks pievienots šeit.</p></div>
      </section>
      <footer class="disclaimer"><span>!</span><p><strong>Inženiertehniska piezīme.</strong> Šis ir vienkāršots lieces stiprības novērtējums vienkārši balstītai sijai. Tas neaizstāj projektēšanas normatīvu pārbaudes vai kvalificēta speciālista izvērtējumu.</p></footer>
    </div>
  </main>
</template>
