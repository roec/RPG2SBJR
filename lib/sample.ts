export const SAMPLE_RPG = `     H DFTACTGRP(*NO) ACTGRP(*CALLER)
     FCBANKPF IF   E           K DISK
     D CustomerNo      S              7P 0
     D CustomerName    S             40A
     D RiskFlag        S              1A
     C     *ENTRY        PLIST
     C                   PARM                    CustomerNo
     C     CustomerNo    CHAIN     CBANKPF
     C                   IF        %FOUND(CBANKPF)
     C                   EVAL      CustomerName = CUSTNAME
     C                   EVAL      RiskFlag = RISKFLAG
     C                   ELSE
     C                   EVAL      CustomerName = 'NOT FOUND'
     C                   ENDIF
     C                   RETURN`;
