// import React, { useEffect, useState } from "react";
// import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
// import axios from "axios";
// import config from "../../config";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { VictoryPie, VictoryChart, VictoryBar, VictoryTheme } from "victory-native";


// export default function StatisticsScreen() {
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState<{ orders: number; users: number; revenue: number }>({
//     orders: 0,
//     users: 0,
//     revenue: 0,
//   });

//   useEffect(() => {
//     const fetchAdminStats = async () => {
//       try {
//         const token = await AsyncStorage.getItem("accessToken");
//         if (!token) {
//           console.error("No access token found");
//           return;
//         }

//         const response = await axios.get(`${config.BASE_URL}/admin/stats`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         // נניח שהשרת מחזיר את הנתונים בצורה:
//         const { ordersCount, usersCount, totalRevenue } = response.data;
//         setStats({
//           orders: ordersCount,
//           users: usersCount,
//           revenue: totalRevenue,
//         });
//       } catch (error) {
//         console.error("❌ Failed to fetch admin stats:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAdminStats();
//   }, []);

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" color="#6b4226" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Admin Statistics</Text>

//       {/* 🔹 גרף עמודות להצגת נתוני סטטיסטיקה */}
//       <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
//         <VictoryBar
//           data={[
//             { category: "Orders", count: stats.orders },
//             { category: "Users", count: stats.users },
//             { category: "Revenue", count: stats.revenue },
//           ]}
//           x="category"
//           y="count"
//           style={{ data: { fill: "#6b4226" } }}
//         />
//       </VictoryChart>

//       {/* 🔹 תרשים עוגה להצגת פילוח הזמנות */}
//       <VictoryPie
//         data={[
//           { x: "Orders", y: stats.orders },
//           { x: "Users", y: stats.users },
//           { x: "Revenue", y: stats.revenue },
//         ]}
//         colorScale={["#FFA500", "#007bff", "#28a745"]}
//         innerRadius={50}
//         labels={({ datum }: { datum: { x: string; y: number } }) => `${datum.x}\n${datum.y}`}
//         />

//       {/* 🔹 טקסט עם נתונים מספריים */}
//       <Text style={styles.statText}>📦 Total Orders: {stats.orders}</Text>
//       <Text style={styles.statText}>👥 Total Users: {stats.users}</Text>
//       <Text style={styles.statText}>💰 Total Revenue: ${stats.revenue.toFixed(2)}</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9f3ea" },
//   title: { fontSize: 26, fontWeight: "bold", color: "#6b4226", marginBottom: 20 },
//   statText: { fontSize: 18, color: "#6b4226", marginTop: 10, fontWeight: "bold" },
// });
