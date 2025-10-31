import pandas as pd
import numpy as np

# Define your data
df_1 = {
        "BLNumber": "BL123456789",
        "ContainerNumber": "CONT9876543",
        "DateOfMovement": "2025-08-20",
        "PortOfDischarge": "SGSIN",  # Singapore
        "PortOfLoading": "INMUM",    # Mumbai
        "SealNumber": "SEAL56789",
        "ShippingLineID": "SL001",
        "VesselID": "VESSEL9988",
        "VGM": 24500,  # Verified Gross Mass in KG
        "VoyageID": "VOY20250820",
        "ShipperCode": "SHIP123",
        "ShipperName": "Global Logistics Pvt Ltd",
        "OOGHeight": 2.5,  # meters
        "OOGFront": 1.2,
        "OOGBack": 1.1,
        "OOGLeft": 0.8,
        "OOGRight": 0.9,
        "Loading Time": "2 hrs",
        "vesselDate": "27/10/1997"
    } 
df_1_2 = {
    "containerNumber": "WHSU0107145",
    "loadPort": "INNSA",
    "dischargePort": "AEJEA",
    "destinationPort": "AEJEA",
    "lineCode": "WHD",
    "terminalId": "T2",
    "isoCode": "2200",
    "containerCategory": "F",
    "containerCategoryStatus": "I",
    "containerMoveDate": "05/Aug/2025 9:10:00 AM",
    "containerIMCO1": None,
    "containerUNNO1": None,
    "containerIMCO2": None,
    "containerUNNO2": None,
    "containerIMCO3": None,
    "containerUNNO3": None,
    "containerIMCO4": None,
    "containerUNNO4": None,
    "containerIMCO5": None,
    "containerUNNO5": None,
    "containerIMCO6": None,
    "containerUNNO6": None,
    "vesselName": "WAN HAI 501",
    "voyageNumber": "W258",
    "callSign": "S6AS7",
    "rotationNumebr": "941413"
  }
df_2 = {
        "Vehicle Date": "27th Oct 1997", 
        "LoadTiming": "180 mins",
        "Shipping Bill No": "SBN56789",
        "Container No.": "CONT1122334",
        "Sailing date and time of the Port": "2025-09-10 14:30:00",
        "Port Of Discharge": "USLAX",  # Los Angeles
        "Port Of Loading": "SGSIN",    # Singapore
        "Custom’s Container Seal Number": "CSEAL445566",
        "Shipping Container Seal Number": "SEAL778899",
        "Shipping Line Code": "MAEU",  # Maersk Line
        "Call Sign/Vessel Code": "9V1234",
        "Weight Quantity": 27800,      # in KG
        "Voyage Number": "VOY998877",
        "Shipping Agent Code": "SAC001",
        "Shipping Agent": "Oceanic Shipping Ltd.",
        "Over Dimension Height": 3.2,  # meters
        "Dimension Code": "DIM45HQ",
        "Over Dimension Width": 2.8,   # meters
        "Over Dimension Length": 13.5  # meters
    }
 
# Convert dictionaries to DataFrames
df1 = pd.DataFrame(list(df_1.items()))
df2 = pd.DataFrame(list(df_2.items()))
df11 = pd.DataFrame(list(df_1_2.items()))
# Save to CSV
df1.to_csv("source1.csv", index=False)
df1.to_csv("source2.csv", index=False)
df2.to_csv("target.csv", index=False)

print("✅ Saved df_1.csv and df_2.csv successfully!")
