# Scientific Methodology & Deterministic Calculation Specification

**Product:** MetalSense — Heavy Metal Pollution Intelligence  
**Version:** 1.0.0  
**Matrix:** Aqueous (Drinking Water & Groundwater)

---

## 1. Scientific Integrity Policy
- **No Black-Box Arithmetic:** Large Language Models (LLMs) and OCR services are strictly prohibited from performing numerical operations, computing indices, or deciding legal water safety.
- **Traceability:** Every computed index preserves the exact formula version, input snapshot, unit normalization coefficients, and intermediate sub-indices ($W_i, Q_i, W_i \cdot Q_i$).
- **No Hallucinated Standards:** All regulatory thresholds are sourced from official published documents (BIS 10500:2012, WHO GDWQ 4th Ed).

---

## 2. Water Quality Index Formulations

### 2.1 Heavy Metal Pollution Index (HPI)
**Citations:**
- Mohan, S. V., Nithila, P., & Reddy, S. J. (1996). *Estimation of heavy metal in drinking water and development of heavy metal pollution index.* Journal of Environmental Science & Health Part A, 31(2), 283-289.
- Prasad, B., & Bose, J. M. (2001). *Evaluation of heavy metal pollution in surface and ground water of an industrial area.* Environmental Monitoring and Assessment, 67(3), 323-333.

**Mathematical Formulation:**
$$\text{HPI} = \frac{\sum_{i=1}^n W_i \cdot Q_i}{\sum_{i=1}^n W_i}$$

Where:
- $W_i = \frac{k}{S_i}$ is the unit weightage for the $i$-th heavy metal, inversely proportional to the permissible limit $S_i$ ($k = 1$).
- $Q_i = \frac{|M_i - I_i|}{S_i - I_i} \times 100$ is the sub-index of the $i$-th metal.
- $M_i$ is the monitored concentration.
- $I_i$ is the ideal concentration (0 for toxic heavy metals).
- $S_i$ is the permissible standard limit.

**Classification Scheme:**
- $\text{HPI} < 25$: Low Pollution (Pristine)
- $25 \le \text{HPI} < 100$: Medium / Moderate Pollution
- $\text{HPI} \ge 100$: High / Critical Pollution (Exceeds drinking threshold)

---

### 2.2 Heavy Metal Evaluation Index (HEI)
**Citation:**
- Edet, A. E., & Offiong, O. E. (2002). *Evaluation of water quality index for heavy metal in groundwaters of Calabar, SE Nigeria.* Environmental Geology, 42(7), 776-783.

**Mathematical Formulation:**
$$\text{HEI} = \sum_{i=1}^n \frac{H_c}{H_{mac}}$$

Where:
- $H_c$ is the monitored analytical concentration.
- $H_{mac}$ is the Maximum Admissible Concentration (permissible limit) from the selected standard.

**Classification Scheme:**
- $\text{HEI} < 10$: Low Contamination
- $10 \le \text{HEI} \le 20$: Medium Contamination
- $\text{HEI} > 20$: High Contamination

---

### 2.3 Degree of Contamination ($C_d$)
**Citation:**
- Backman, B., Bodiš, D., Lahermo, P., Rapant, S., & Tarvainen, T. (1998). *Application of a summary environmental and quality index for contaminated waters.* Environmental Geology, 36(1-2), 55-64.

**Mathematical Formulation:**
$$C_d = \sum_{i=1}^n C_{fi}, \quad \text{where } C_{fi} = \frac{C_{Ai}}{C_{Ni}} - 1$$

Where:
- $C_{fi}$ is the contamination factor for analyte $i$.
- $C_{Ai}$ is the analytical concentration.
- $C_{Ni}$ is the baseline permissible/acceptable standard limit.

**Classification Scheme:**
- $C_d < 1$: Low Contamination
- $1 \le C_d \le 3$: Medium Contamination
- $C_d > 3$: High Contamination

---

## 3. Limit of Detection (LOD) Handling Strategies
When laboratory instruments report measurements below detection threshold ($< \text{LOD}$):
1. **Half-LOD (0.5 × LOD):** Default recommended method aligned with US EPA risk evaluation guidelines.
2. **Zero (0):** Optimistic lower-bound estimation.
3. **Full LOD (1.0 × LOD):** Conservative upper-bound worst-case screening.

Every report explicitly tags the strategy chosen and applies it uniformly across all sub-index equations.

---

## 4. Worked Numerical Calculation & Invariant Proof

### 4.1 Boundary Invariant: $M_i = S_i$ for all Analytes
Consider a groundwater sample where all evaluated heavy metals are at their exact statutory permissible limit ($S_i$):
- For any analyte $i$, $Q_i = \frac{S_i}{S_i} \times 100 = 100$.
- Substituting into HPI:
  $$\text{HPI} = \frac{\sum_{i=1}^n W_i \cdot 100}{\sum_{i=1}^n W_i} = \frac{100 \sum W_i}{\sum W_i} = 100.00$$
- This mathematical invariant is verified in the automated test suite (`tests/unit/worked_examples.test.ts`).

### 4.2 Step-by-Step Numerical Worked Example
Sample: **Industrial Borewell Well #4 (Delhi Aquifer)**
Evaluated against **BIS 10500:2012 Drinking Water Specification**:

| Metal ($i$) | Monitored $M_i$ (mg/L) | Permissible $S_i$ (mg/L) | Weight $W_i = 1/S_i$ | Sub-Index $Q_i$ | $W_i \cdot Q_i$ |
|---|---|---|---|---|---|
| **Arsenic (As)** | 0.042 | 0.05 | 20.00 | 84.00 | 1680.00 |
| **Lead (Pb)** | 0.028 | 0.01 | 100.00 | 280.00 | 28000.00 |
| **Cadmium (Cd)** | 0.0045 | 0.003 | 333.33 | 150.00 | 50000.00 |
| **Chromium (Cr)**| 0.065 | 0.05 | 20.00 | 130.00 | 2600.00 |
| **Iron (Fe)** | 1.450 | 1.00 | 1.00 | 145.00 | 145.00 |
| **Nickel (Ni)** | 0.035 | 0.02 | 50.00 | 175.00 | 8750.00 |
| **Total Sums** | — | — | **$\sum W_i = 524.33$** | — | **$\sum (W_i Q_i) = 91175.00$** |

$$\text{HPI} = \frac{91175.00}{524.33} = 173.89 \implies \text{High / Critical Pollution (HPI} \ge 100\text{)}$$

$$\text{HEI} = \frac{0.042}{0.05} + \frac{0.028}{0.01} + \frac{0.0045}{0.003} + \frac{0.065}{0.05} + \frac{1.45}{1.00} + \frac{0.035}{0.02} = 0.84 + 2.80 + 1.50 + 1.30 + 1.45 + 1.75 = 9.64$$

---

## 5. Official Regulatory Standard Reference Table

### BIS 10500:2012 (Bureau of Indian Standards)
- **Arsenic (As):** Acceptable $0.01\text{ mg/L}$, Permissible $0.05\text{ mg/L}$
- **Cadmium (Cd):** Acceptable $0.003\text{ mg/L}$, Permissible $0.003\text{ mg/L}$ (No relaxation)
- **Total Chromium (Cr):** Acceptable $0.05\text{ mg/L}$, Permissible $0.05\text{ mg/L}$ (No relaxation)
- **Copper (Cu):** Acceptable $0.05\text{ mg/L}$, Permissible $1.5\text{ mg/L}$
- **Iron (Fe):** Acceptable $0.3\text{ mg/L}$, Permissible $1.0\text{ mg/L}$ (2015 amendment)
- **Lead (Pb):** Acceptable $0.01\text{ mg/L}$, Permissible $0.01\text{ mg/L}$ (No relaxation)
- **Manganese (Mn):** Acceptable $0.1\text{ mg/L}$, Permissible $0.3\text{ mg/L}$
- **Nickel (Ni):** Acceptable $0.02\text{ mg/L}$, Permissible $0.02\text{ mg/L}$ (No relaxation)
- **Zinc (Zn):** Acceptable $5.0\text{ mg/L}$, Permissible $15.0\text{ mg/L}$
- **Mercury (Hg):** Acceptable $0.001\text{ mg/L}$, Permissible $0.001\text{ mg/L}$ (No relaxation)
