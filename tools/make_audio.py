# Voices + backgrounds for "The Rain Doesn't Stop".
# Kokoro (offline TTS, Hindi voices) -> pitch/character -> phone line -> mixed with a station soundscape.
import numpy as np, soundfile as sf, os, subprocess, json
from scipy import signal
from kokoro_onnx import Kokoro

SR = 24000
OUT = 'out'; os.makedirs(OUT, exist_ok=True)
K = Kokoro('kokoro-v1.0.onnx', 'voices-v1.0.bin')
rng = np.random.default_rng(7)


def tts(text, voice, speed=1.0, pitch=0.0):
    """pitch in semitones: resample so the voice shifts; speed compensates for duration."""
    f = 2 ** (pitch / 12)
    s, sr = K.create(text, voice=voice, speed=speed * f, lang='hi')
    if pitch:
        s = signal.resample(s, int(len(s) * f))
    return s.astype(np.float32)


def bp(x, lo, hi, order=4):
    sos = signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'); return signal.sosfilt(sos, x)


def lp(x, hi, order=4):
    sos = signal.butter(order, hi, 'lowpass', fs=SR, output='sos'); return signal.sosfilt(sos, x)


def hp(x, lo, order=2):
    sos = signal.butter(order, lo, 'highpass', fs=SR, output='sos'); return signal.sosfilt(sos, x)


def norm(x, peak=.9):
    m = np.max(np.abs(x)) or 1; return x / m * peak


def phone(x, grit=1.0):
    """old landline: band-limited, slightly crushed, saturated, with line hiss."""
    y = bp(x, 320, 3300, 6)
    y = np.tanh(y / (np.max(np.abs(y)) + 1e-9) * (2.2 * grit)) * .8
    # 8 kHz sample-and-hold for that telephone grain
    step = SR // 8000; y = np.repeat(y[::step], step)[:len(x)]
    y = bp(y, 300, 3400, 4)
    y += rng.normal(0, .006, len(y))
    return norm(y, .85)


def room(x, wet=.3, size=.12):
    """cheap reverb: a few decaying echoes (a tin-roof godown / a station hall)."""
    y = x.copy()
    for i, (d, g) in enumerate([(size, .5), (size * 1.7, .35), (size * 2.6, .22), (size * 3.9, .14), (size * 5.3, .08)]):
        n = int(d * SR); z = np.zeros_like(x); z[n:] = x[:-n] * g; y += z * wet * 2
    return y


def pad(x, sec): return np.concatenate([x, np.zeros(int(sec * SR), np.float32)])


def place(track, clip, t):
    n = int(t * SR)
    if n + len(clip) > len(track): track = np.concatenate([track, np.zeros(n + len(clip) - len(track), np.float32)])
    track[n:n + len(clip)] += clip; return track


def save(name, x, mp3=True):
    x = np.clip(x, -1, 1).astype(np.float32); w = f'{OUT}/{name}.wav'; sf.write(w, x, SR)
    if mp3:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-ac', '1', '-b:a', '64k', f'{OUT}/{name}.mp3'], check=True)
    return len(x) / SR


# ---------------- background sound design ----------------
def rain_tin(sec, density=1.0):
    n = int(sec * SR)
    hiss = bp(rng.normal(0, 1, n), 1500, 9000, 2) * .05
    drops = np.zeros(n, np.float32)
    for t in rng.integers(0, n - 400, int(sec * 900 * density)):
        a = rng.uniform(.1, 1) ** 2
        k = np.exp(-np.arange(300) / rng.uniform(12, 40)) * np.sin(np.arange(300) * rng.uniform(.6, 1.6)) * a
        drops[t:t + 300] += k
    tin = bp(drops, 1800, 6000, 2) * .35
    roof = lp(rng.normal(0, 1, n), 400) * .08  # rumble of water on the sheet
    return (hiss + tin + roof).astype(np.float32)


def train_horn(sec=2.6):
    t = np.arange(int(sec * SR)) / SR
    env = np.minimum(1, t / .12) * np.minimum(1, (sec - t) / .4)
    vib = 1 + .004 * np.sin(2 * np.pi * 5 * t)
    x = sum(signal.sawtooth(2 * np.pi * f * vib * t) * g for f, g in [(277, .5), (349, .45), (415, .3)])
    x = lp(x, 2200) * env
    return room(x * .35, .5, .09)


def chime():
    t = np.arange(int(1.9 * SR)) / SR; x = np.zeros_like(t)
    for i, f in enumerate([659.3, 784, 987.8, 784]):
        tt = t - i * .38; m = tt > 0
        x[m] += np.sin(2 * np.pi * f * tt[m]) * np.exp(-tt[m] * 3) * .5 + np.sin(2 * np.pi * f * 2 * tt[m]) * np.exp(-tt[m] * 5) * .12
    return room(x, .5, .11)


def pa(x):
    """station loudspeaker: honky horn speaker + big hall echo."""
    y = bp(x, 500, 4200, 4); y = np.tanh(y * 3) * .5
    return room(y, .55, .13)


def generator(sec):
    t = np.arange(int(sec * SR)) / SR
    x = sum(np.sin(2 * np.pi * 50 * h * t + h) / h for h in range(1, 7))
    chug = 1 + .25 * np.sign(np.sin(2 * np.pi * 12.5 * t))
    return lp(x * chug, 600) * .12


def dog(t0, track, n=3):
    for i in range(n):
        t = np.arange(int(.18 * SR)) / SR
        f = 520 * np.exp(-t * 3)
        b = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * .25
        track = place(track, room(bp(b, 300, 2500), .5, .1), t0 + i * .32)
    return track


# ---------------- voices ----------------
V = {}
print('voices…')
announce = tts('यात्रीगण कृपया ध्यान दें। गाड़ी संख्या एक दो नौ दो दो, प्लेटफ़ॉर्म नंबर चार पर आ रही है।', 'hf_alpha', 1.0)
chaiwala = tts('चाय… गरम चाय…', 'hm_psi', .9, -1)

LINES = {
    # ransom call, 2:15 AM, recorded on Asha's phone
    'ransom_1': ('रिपोर्टर हमारे पास है।', 'hm_omega', .85, -3),
    'ransom_2': ('उसके सारे काग़ज़ लेकर आना। पुलिस नहीं।', 'hm_omega', .85, -3),
    'ransom_3': ('सुबह होते ही फिर फ़ोन करेंगे। एक गलती, और…', 'hm_omega', .82, -3),
    # godown guard (when you dial 1987142160)
    'guard_1': ('हाँ? कौन बोल रहा है? रात के तीन बजे फ़ोन करता है?', 'hm_psi', 1.0, -1.5),
    'guard_2': ('ग़लत नंबर है। रखो फ़ोन।', 'hm_psi', 1.05, -1.5),
    # chai stall owner
    'chai_1': ('हाँ साहब, चाय ठिकाना। हाँ, राकेश जी आए थे, नौ बजे।', 'hm_omega', 1.05, 1.5),
    'chai_2': ('पप्पू के साथ बैठे थे, गोदाम में काम करता है। एक पैकेट दिया था उसको।', 'hm_omega', 1.05, 1.5),
    'chai_3': ('पप्पू बोला, वो पैकेट आपके दफ़्तर के दरवाज़े पे छोड़ आया है।', 'hm_omega', 1.05, 1.5),
    # editor, night desk
    'editor_1': ('इंदौर इवनिंग पोस्ट। राकेश? नहीं, शाम की मीटिंग के बाद से उससे कोई बात नहीं हुई।', 'hm_psi', 1.0, 2.5),
    'editor_2': ('क… क्या? मैंने तो बस बताया था कि वो कहाँ जा रहा है। उन्होंने कहा था किसी को कुछ नहीं होगा!', 'hm_psi', 1.08, 2.5),
    # inspector
    'police_1': ('हाँ, बोलिए। प्लेटफ़ॉर्म चार के पीछे वाला गोदाम? ठीक है, टीम निकल रही है।', 'hm_omega', 1.0, -1),
    'police_2': ('और एडिटर का नाम भी नोट कर लिया है। सुबह बात करेंगे उससे।', 'hm_omega', 1.0, -1),
    # Asha's voice note when the game opens
    'asha_1': ('मैंने सब आपके टेबल पे रख दिया है। उनका बैग, घड़ी, सब कुछ। प्लीज़, उन्हें ढूंढ लीजिए।', 'hf_beta', .95, 0),
}
raw = {k: tts(*v) for k, v in LINES.items()}
meta = {}

# ---------- 1) ransom call: separate VOICE and BACKGROUND stems (the mixer plays both in sync) ----------
voice = np.zeros(int(12 * SR), np.float32)
voice = place(voice, raw['ransom_1'], .6)
voice = place(voice, raw['ransom_2'], .6 + len(raw['ransom_1']) / SR + .7)
t3 = .6 + (len(raw['ransom_1']) + len(raw['ransom_2'])) / SR + 1.6
voice = place(voice, raw['ransom_3'], t3)
L = len(voice) / SR + 1.2
voice = pad(voice, 1.2)
bg = rain_tin(L) * 1.2
bg = place(bg, train_horn(2.4) * .9, 2.0)
bg = place(bg, pa(chime()) * .5, 4.6)
bg = place(bg, pa(announce) * .9, 6.4)
bg = place(bg, room(bp(chaiwala, 250, 4000), .4, .08) * .35, 1.0)
bg = place(bg, room(bp(chaiwala, 250, 4000), .4, .08) * .3, L - 3.0)
gen = generator(len(bg) / SR)
bg = bg[:len(voice)] if len(bg) >= len(voice) else pad(bg, (len(voice) - len(bg)) / SR)
gen = gen[:len(bg)]
# both stems go through the same phone line, so the background is "behind" the voice, not on top
save('ransom_voice', phone(voice) * .95)
save('ransom_bg', phone(bg + gen * .0) * .9)
save('ransom_gen', phone(gen * 3) * .5)   # the low generator hum, revealed by the TONE knob in Act 2
meta['ransom'] = {'len': round(len(voice) / SR, 2), 'ransom_1': .6, 'ransom_2': round(.6 + len(raw['ransom_1']) / SR + .7, 2), 'ransom_3': round(t3, 2), 'horn': 2.0, 'chime': 4.6, 'announce': 6.4, 'chai': 1.0}


# ---------- 2) phone calls you make (pre-mixed, through the line) ----------
def call(name, parts, bgmix=0.0, gap=.6, extra=None):
    v = np.zeros(int(.5 * SR), np.float32); marks = []
    for p in parts:
        marks.append(round(len(v) / SR, 2)); v = np.concatenate([v, raw[p], np.zeros(int(gap * SR), np.float32)])
    v = pad(v, .6); L = len(v) / SR
    b = np.zeros_like(v)
    if bgmix:
        b = rain_tin(L) * 1.0
        b = place(b, train_horn(2.2) * .9, .9)[:len(v)]
        b = place(b, pa(chime()) * .5, min(3.2, L - 2))[:len(v)]
        b = place(b, pa(announce) * .8, min(4.6, max(0, L - 5)))[:len(v)]
        b += generator(L)[:len(v)] * .9
        b = b[:len(v)]
    if extra: b = extra(b)[:len(v)]
    d = save(name, phone(v + b * bgmix))
    meta[name] = {'len': round(d, 2), 'marks': marks}


call('call_godown', ['guard_1', 'guard_2'], bgmix=1.0, gap=1.1, extra=lambda b: dog(1.8, b, 3))
call('call_chai', ['chai_1', 'chai_2', 'chai_3'], gap=.5, extra=lambda b: b + rain_tin(len(b) / SR, .5)[:len(b)] * .7 + place(np.zeros_like(b), room(bp(chaiwala, 250, 4000)) * .25, 2.0)[:len(b)])
call('call_editor', ['editor_1'], gap=.4)
call('call_editor_confront', ['editor_2'], gap=.4)
call('call_police', ['police_1'], gap=.4)
call('call_police_editor', ['police_1', 'police_2'], gap=.5)
# Asha's voice note: a phone recording, not a live line; lighter processing
asha = pad(np.concatenate([np.zeros(int(.3 * SR), np.float32), raw['asha_1']]), .4)
save('asha_note', norm(bp(asha, 120, 7000, 2), .8) + rng.normal(0, .003, len(asha)).astype(np.float32))
meta['asha_note'] = {'len': round(len(asha) / SR, 2)}

json.dump(meta, open(f'{OUT}/meta.json', 'w'), indent=1)
print(json.dumps(meta, indent=1))
