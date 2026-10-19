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
