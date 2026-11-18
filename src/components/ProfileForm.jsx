import { useState } from 'react';
import PlacePicker from './PlacePicker.jsx';
import { allTimezones } from '../lib/places.js';

const EMPTY = { name: '', gender: 'female', date: '', time: '', place: null };

export default function ProfileForm({ initial, onSave, onCancel, submitLabel = 'Save profile' }) {
  const [f, setF] = useState({ ...EMPTY, ...initial });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));

  function submit(e) {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Add a name.');
    if (!f.date) return setErr('Add the date of birth.');
    if (!f.time) return setErr('Add the time of birth. If unsure, use 12:00 and note the chart’s ascendant may be off.');
    if (!f.place) return setErr('Pick the place of birth from the list.');
    const y = +f.date.slice(0, 4);
    if (y < 1800 || y > 2100) return setErr('Dates between 1800 and 2100 are supported.');
    setErr('');
    onSave({ ...f, name: f.name.trim() });
  }

  return (
    <form onSubmit={submit} className="form-grid" noValidate>
      <div className="field">
        <label htmlFor="pf-name">Name</label>
        <input id="pf-name" className="input" value={f.name} onChange={set('name')} placeholder="Full name" />
      </div>
      <div className="field">
        <label htmlFor="pf-gender">Gender</label>
        <select id="pf-gender" className="select" value={f.gender} onChange={set('gender')}>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="pf-date">Date of birth</label>
        <input id="pf-date" type="date" className="input" value={f.date} min="1800-01-01" max="2100-12-31" onChange={set('date')} />
      </div>
      <div className="field">
        <label htmlFor="pf-time">Time of birth (local)</label>
        <input id="pf-time" type="time" className="input" value={f.time} onChange={set('time')} />
      </div>
      <div className="field full">
        <label htmlFor="pf-place">Place of birth</label>
        <PlacePicker id="pf-place" value={f.place} onChange={set('place')} />
      </div>
      {f.place && (
        <div className="field full">
          <label htmlFor="pf-tz">Time zone of the birthplace</label>
          <select
            id="pf-tz"
            className="select"
            value={f.place.tz}
            onChange={(e) => setF((x) => ({ ...x, place: { ...x.place, tz: e.target.value, tzGuessed: false } }))}
          >
            {(allTimezones().includes(f.place.tz) ? allTimezones() : [f.place.tz, ...allTimezones()]).map((z) => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
          </select>
          <span className="hint">Filled in automatically. Historical daylight-saving rules for this zone are applied to the birth time.</span>
        </div>
      )}
      {err && <div className="full pill bad" style={{ justifySelf: 'start', whiteSpace: 'normal' }}>{err}</div>}
      <div className="full row">
        <button className="btn" type="submit">{submitLabel}</button>
        {onCancel && <button className="btn ghost" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
