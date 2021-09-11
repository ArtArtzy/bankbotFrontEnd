<template>
  <div class="q-pa-md" style="width: 500px">
    <q-input v-model="text" filled type="textarea" ref="textinput" /><br />
    <q-btn
      color="primary"
      label="Run"
      @click="runBtn"
      @keyup:enter="runBtn"
      style="width:400px;"
    />
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      text: "",
      lineSet: [0, 0, 0, 0],
      bankName: "",
      finalData: [],
      accountType: "saving",
      accountNumber: "",
      transectionData: [],
      serverPath: "https://yaksaconcept.com/bankbotapi/"
    };
  },
  methods: {
    async runBtn() {
      this.lineSet = [0, 0, 0, 0];
      this.transectionData = [];
      let lines = this.text.split("\n");
      let linesClean = lines.filter(x => x.trim() != "" && x.trim() != "\t");

      //Check SCB
      let bankCheck = linesClean[linesClean.length - 1];

      //************กรณีเป็น SCB ************/
      if (bankCheck.indexOf("ธนาคารไทยพาณิชย์") >= 0) {
        this.bankName = "SCB";
        //เริ่มวิ่งหาเลขบัญชี
        let count = 0;
        linesClean.forEach(x => {
          //หาคำว่าออมศัพท์ (1) เพื่อเอาเลขบัญชี
          if (x.indexOf("ออมทรัพย์") >= 0) {
            if (this.lineSet[0] == 0) {
              this.lineSet[0] = count;
            }
          }
          //ชื่อบัญชี (2)
          //จุดเริ่มต้นของ Transection (3)
          if (x.indexOf("วันที่	เวลา	รายการ") >= 0) {
            this.lineSet[2] = count + 1;
          }
          //จุดสุดท้ายของ Transection (4)
          if (x.indexOf("รวม") >= 0) {
            if (this.lineSet[3] == 0) {
              this.lineSet[3] = count - 1;
            }
          }
          count++;
        });
        this.lineSet[1] = this.lineSet[0] + 2;
        this.accountNumber = linesClean[this.lineSet[0]].split("-")[1].trim();
        let startRead = this.lineSet[2];
        let endRead = this.lineSet[3];
        for (let i = startRead; i <= endRead; i++) {
          let dataTemp = linesClean[i].split("	").filter(x => x.trim() != "");
          if (Number(dataTemp[4].replace(",", "")) > 0) {
            let dateTemp =
              dataTemp[0].split("/")[2] +
              "/" +
              dataTemp[0].split("/")[1] +
              "/" +
              dataTemp[0].split("/")[0] +
              " " +
              dataTemp[1];
            //Check ToBank
            let toBankTemp = "";
            let toAccountNo = "";
            if (dataTemp[5].includes("KBANK")) {
              toBankTemp = "KBANK";
              toAccountNo = dataTemp[5].split("/")[1].trim();
            } else if (dataTemp[5].includes("SCB")) {
              toBankTemp = "SCB";
              toAccountNo = dataTemp[5].split(" ")[2].trim();
            } else if (dataTemp[5].includes("KTB")) {
              toBankTemp = "KTB";
              toAccountNo = dataTemp[5].split("/")[1].trim();
            } else if (dataTemp[5].includes("GSB")) {
              toBankTemp = "GSB";
              toAccountNo = dataTemp[5].split("/")[1].trim();
            } else if (dataTemp[5].includes("BAY")) {
              toBankTemp = "BAY";
              toAccountNo = dataTemp[5].split("/")[1].trim();
            } else if (dataTemp[5].includes("BBL")) {
              toBankTemp = "BBL";
              toAccountNo = dataTemp[5].split("/")[1].trim();
            } else if (dataTemp[5].includes("TTB")) {
              toBankTemp = "TTB";
              toAccountNo = dataTemp[5].split("/")[1].trim();
            } else if (dataTemp[5].includes("CIMB")) {
              toBankTemp = "CIMB";
              toAccountNo = dataTemp[5].split("/")[1].trim();
            } else if (dataTemp[5].includes("BAAC")) {
              toBankTemp = "BAAC";
              toAccountNo = dataTemp[5].split("/")[1].trim();
            }
            let inputTemp = {
              TxDateTime: dateTemp,
              TxBankId: this.bankName,
              TxAccountNo: this.accountNumber,
              TxType: this.accountType,
              TxToBankId: toBankTemp,
              TxToAccountNo: toAccountNo,
              TxAmount: Number(dataTemp[4].replace(",", "")),
              TxEndingBalance: 0.0,
              BankRef: "-"
            };
            // console.log(inputTemp);
            this.transectionData.push(inputTemp);
          }
        }
      }
      // console.log(this.transectionData);
      //***********จบ SCB */
      //***กรณี ของ KBANK */
      else if (bankCheck.indexOf("ธนาคารกสิกรไทย") >= 0) {
        this.bankName = "KBANK";
        //เริ่มวิ่งหาเลขบัญชี
        let count = 0;
        linesClean.forEach(x => {
          //หาคำว่าออมศัพท์ (1) เพื่อเอาเลขบัญชี
          if (x.indexOf("เลขที่บัญชี") >= 0) {
            if (this.lineSet[0] == 0) {
              this.lineSet[0] = count + 2;
              this.lineSet[1] = count + 3;
            }
          }
          //ชื่อบัญชี (2)
          //จุดเริ่มต้นของ Transection (3)
          if (x.indexOf("เวลา	ช่องทาง") >= 0) {
            this.lineSet[2] = count;
          }
          //จุดสุดท้ายของ Transection (4)
          if (x.indexOf("ยอดเงินฝากทั้งหมด (บาท)") >= 0) {
            if (this.lineSet[3] == 0) {
              this.lineSet[3] = count - 1;
            }
          }
          count++;
        });
        this.accountNumber = linesClean[this.lineSet[0]]
          .replace("เลขที่บัญชี", "")
          .trim();
        let startRead = this.lineSet[2];
        let endRead = this.lineSet[3];
        for (let i = startRead + 1; i <= endRead; i = i + 2) {
          let dataTemp = linesClean[i + 1].split("\t");
          if (dataTemp[4] != "") {
            let dateTemp =
              "20" +
              linesClean[i].split("/")[2] +
              "/" +
              linesClean[i].split("/")[1] +
              "/" +
              linesClean[i].split("/")[0] +
              " " +
              linesClean[i + 1].split("	")[0];
            let toBankTemp = "";
            let toAccountNo = "";
            if (dataTemp[6].includes("K PLUS")) {
              toBankTemp = "KBANK";
              toAccountNo = dataTemp[5].trim();
            } else if (dataTemp[6].includes("SCBA")) {
              toBankTemp = "SCB";
              toAccountNo = "-";
            } else if (dataTemp[6].includes("KTBA")) {
              toBankTemp = "KTB";
              toAccountNo = "-";
            } else if (dataTemp[6].includes("GSBA")) {
              toBankTemp = "GSB";
              toAccountNo = "-";
            } else if (dataTemp[6].includes("TMBA")) {
              toBankTemp = "TMB";
              toAccountNo = "-";
            } else if (dataTemp[6].includes("BBLA")) {
              toBankTemp = "BBL";
              toAccountNo = "-";
            } else if (dataTemp[6].includes("BAYA")) {
              toBankTemp = "BAY";
              toAccountNo = "-";
            } else if (dataTemp[6].includes("KKBA")) {
              toBankTemp = "KKB";
              toAccountNo = "-";
            }
            let inputTemp = {
              TxDateTime: dateTemp,
              TxBankId: this.bankName,
              TxAccountNo: this.accountNumber,
              TxType: this.accountType,
              TxToBankId: toBankTemp,
              TxToAccountNo: toAccountNo,
              TxAmount: Number(dataTemp[4].replace(",", "")),
              TxEndingBalance: 0.0,
              BankRef: "-"
            };
            this.transectionData.push(inputTemp);
          }
        }
        /****************จบ KBANK */
      } else if (bankCheck.indexOf("ธนาคารกรุงศรีอยุธยา") >= 0) {
        /************ฺBAY */
        this.bankName = "BAY";
        //เริ่มวิ่งหาเลขบัญชี
        let count = 0;
        linesClean.forEach(x => {
          //หาคำว่าออมศัพท์ (1) เพื่อเอาเลขบัญชี
          if (x.indexOf("เลขที่บัญชี") >= 0) {
            if (this.lineSet[0] == 0) {
              this.lineSet[0] = count;
            }
          }
          //ชื่อบัญชี (2)
          //จุดเริ่มต้นของ Transection (3)
          if (x.indexOf("วันที่	รหัส	หมายเลขอ้างอิง") >= 0) {
            this.lineSet[2] = count + 2;
          }
          //จุดสุดท้ายของ Transection (4)
          if (x.indexOf("ดาวน์โหลดรายการเดินบัญชี : ") >= 0) {
            if (this.lineSet[3] == 0) {
              this.lineSet[3] = count - 1;
            }
          }
          count++;
        });
        this.accountNumber = linesClean[this.lineSet[0]]
          .replace("เลขที่บัญชี", "")
          .trim();
        let startRead = this.lineSet[2];
        let endRead = this.lineSet[3];
        for (let i = startRead; i <= endRead; i++) {
          let dataTemp = linesClean[i].split("\t");
          if (dataTemp[5] != "") {
            let today = new Date();
            let timeCurrent =
              today.getHours() +
              ":" +
              String(today.getMinutes()).padStart(2, "0");
            let dateTemp =
              dataTemp[0].split("/")[2] +
              "/" +
              dataTemp[0].split("/")[1] +
              "/" +
              dataTemp[0].split("/")[0] +
              " " +
              timeCurrent;
            let date2 =
              dataTemp[0].split("/")[2] +
              "/" +
              dataTemp[0].split("/")[1] +
              "/" +
              dataTemp[0].split("/")[0];
            let refData = dataTemp[2];
            let refBankId = refData.substring(0, 2);
            let toBankTemp = "-";
            if (refBankId == "14") {
              toBankTemp = "SCB";
            } else if (refBankId == "02") {
              toBankTemp = "BBL";
            } else if (refBankId == "04") {
              toBankTemp = "KBANK";
            } else if (refBankId == "06") {
              toBankTemp = "KTB";
            } else if (refBankId == "11") {
              toBankTemp = "TMB";
            } else if ((refBankId = "69")) {
              toBankTemp = "KK";
            } else if ((refBankId = "25")) {
              toBankTemp = "BAY";
            } else if ((refBankId = "22")) {
              toBankTemp = "CIMBT";
            } else if ((refBankId = "34")) {
              toBankTemp = "BAAC";
            } else if ((refBankId = "65")) {
              toBankTemp = "TBANK";
            } else if ((refBankId = "24")) {
              toBankTemp = "UOB";
            } else if ((refBankId = "20")) {
              toBankTemp = "SCBT";
            } else if ((refBankId = "30")) {
              toBankTemp = "GSB";
            }
            let inputTemp = {
              TxDateTime: dateTemp,
              TxBankId: this.bankName,
              TxAccountNo: this.accountNumber,
              TxType: this.accountType,
              TxToBankId: toBankTemp,
              TxToAccountNo: refData.substring(2),
              TxAmount: Number(dataTemp[5]),
              TxEndingBalance: Number(dataTemp[6].replace(",", "")),
              BankRef: date2
            };
            console.log(inputTemp);
            this.transectionData.push(inputTemp);
          }
        }
      }
      //*********จบ case bay */
      let option = {
        TxBankId: this.bankName,
        TxAccountNo: this.accountNumber
      };
      let url = this.serverPath + "getlasttransection.php";
      let res = await axios.post(url, JSON.stringify(option));

      if (res.data.length > 0) {
        let startSyncId = 0;
        let finalSync = 0;
        this.transectionData.forEach(x => {
          if (x.TxBankId != "BAY") {
            if (
              x.TxDateTime == res.data[0].TxDateTime &&
              x.TxToBankId == res.data[0].TxToBankId &&
              x.TxAmount == res.data[0].TxAmount
            ) {
              finalSync = startSyncId;
            }
          } else {
            if (
              x.BankRef == res.data[0].BankRef &&
              x.TxEndingBalance == res.data[0].TxEndingBalance
            ) {
              finalSync = startSyncId;
            }
          }
          startSyncId++;
        });

        if (this.bankName != "BAY") {
          for (let i = finalSync - 1; i >= 0; i--) {
            let temp = this.transectionData[i];
            let url2 = this.serverPath + "addtransection.php";
            let res2 = await axios.post(url2, JSON.stringify(temp));
          }
        } else {
          for (let i = finalSync + 1; i < this.transectionData.length; i++) {
            let temp = this.transectionData[i];
            let url2 = this.serverPath + "addtransection.php";
            let res2 = await axios.post(url2, JSON.stringify(temp));
          }
        }
        this.text = "";
      } else {
        if (this.bankName != "BAY") {
          for (let i = this.transectionData.length - 1; i >= 0; i--) {
            let url2 = this.serverPath + "addtransection.php";
            let res2 = await axios.post(
              url2,
              JSON.stringify(this.transectionData[i])
            );
          }
        } else {
          for (let i = 0; i < this.transectionData.length; i++) {
            let url2 = this.serverPath + "addtransection.php";
            let res2 = await axios.post(
              url2,
              JSON.stringify(this.transectionData[i])
            );
          }
        }
      }
      this.text = "";
    }
  },
  mounted() {
    this.$refs.textinput.focus();
  }
};
</script>

<style lang="scss" scoped></style>
